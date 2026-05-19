package com.eba.propertyconnect.propertymanagement.property.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.mybatis.cdi.Transactional;

import com.eba.propertyconnect.propertymanagement.property.domain.MasterRecord;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyDocumentRow;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyMaster;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyOwnershipRow;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertySearch;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertySummary;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyTreeNode;
import com.eba.propertyconnect.propertymanagement.property.domain.WorkflowRow;
import com.eba.propertyconnect.propertymanagement.property.mapper.PropertyMapper;
import com.eba.propertyconnect.propertymanagement.util.CacheHelper;
import com.google.gson.JsonParser;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class PropertyService {

	private static final String CACHE_SCOPE = "property-management";

	@Inject
	private PropertyMapper mapper;

	public List<PropertyMaster> list(PropertySearch search) {
		PropertySearch safeSearch = search == null ? new PropertySearch() : search;
		safeSearch.page = safeSearch.page == null || safeSearch.page < 1 ? 1 : safeSearch.page;
		safeSearch.pageSize = safeSearch.pageSize == null || safeSearch.pageSize < 1 ? 25 : Math.min(safeSearch.pageSize, 100);
		safeSearch.offset = (safeSearch.page - 1) * safeSearch.pageSize;
		return mapper.listProperties(safeSearch);
	}

	public PropertyMaster get(Long id) {
		PropertyMaster property = mapper.getProperty(id);
		if (property == null) {
			throw new IllegalArgumentException("Property not found");
		}
		property.ownershipRows = mapper.listOwnershipRows(id);
		property.documentRows = mapper.listDocumentRows(id);
		return property;
	}

	public PropertyMaster create(PropertyMaster request) {
		normalizeProperty(request);
		if (mapper.getPropertyByCode(request.companyId, request.code) != null) {
			throw new IllegalArgumentException("Property code already exists");
		}
		request.onboardingStatus = defaultText(request.onboardingStatus, "DRAFT").toUpperCase(Locale.ROOT);
		request.activeStatus = defaultText(request.activeStatus, "ACTIVE").toUpperCase(Locale.ROOT);
		mapper.insertProperty(request);
		mapper.updatePropertyDocuments(request);
		mapper.updatePropertyOperatingModel(request);
		saveOwnershipRows(request.id, request.ownershipRows, request.updatedBy == null ? request.createdBy : request.updatedBy);
		saveDocumentRows(request.id, request.documentRows, request.updatedBy == null ? request.createdBy : request.updatedBy);
		seedWorkflow(request.id, request.updatedBy == null ? request.createdBy : request.updatedBy);
		clearCache();
		return get(request.id);
	}

	public PropertyMaster saveProfile(Long id, PropertyMaster request) {
		get(id);
		normalizeProperty(request);
		request.id = id;
		mapper.updatePropertyProfile(request);
		saveOwnershipRows(id, request.ownershipRows, request.updatedBy);
		clearCache();
		return get(id);
	}

	public PropertyMaster saveDocuments(Long id, PropertyMaster request) {
		get(id);
		request.id = id;
		mapper.updatePropertyDocuments(request);
		saveDocumentRows(id, request.documentRows, request.updatedBy);
		clearCache();
		return get(id);
	}

	public PropertyMaster saveOperatingModel(Long id, PropertyMaster request) {
		get(id);
		request.id = id;
		if (!isBlank(request.onboardingStatus)) {
			request.onboardingStatus = request.onboardingStatus.trim().toUpperCase(Locale.ROOT);
		}
		mapper.updatePropertyOperatingModel(request);
		clearCache();
		return get(id);
	}

	public List<MasterRecord> blocks(Long propertyId) {
		get(propertyId);
		return mapper.listBlocks(propertyId);
	}

	public MasterRecord saveBlock(Long propertyId, MasterRecord request) {
		get(propertyId);
		MasterRecord record = normalizeStructure(request, propertyId, "Block");
		record.parentId = propertyId;
		if (record.id == null) {
			mapper.insertBlock(record);
		}
		else {
			mapper.updateBlock(record);
		}
		clearCache();
		return record;
	}

	public void deactivateBlock(Long id, Long updatedBy) {
		if (mapper.deactivateBlock(id, updatedBy) == 0) {
			throw new IllegalArgumentException("Block not found or already inactive");
		}
		clearCache();
	}

	public List<MasterRecord> floors(Long blockId) {
		return mapper.listFloors(blockId);
	}

	public MasterRecord saveFloor(Long blockId, MasterRecord request) {
		MasterRecord record = normalizeStructure(request, blockId, "Floor");
		record.parentId = blockId;
		if (record.id == null) {
			mapper.insertFloor(record);
		}
		else {
			mapper.updateFloor(record);
		}
		clearCache();
		return record;
	}

	public void deactivateFloor(Long id, Long updatedBy) {
		if (mapper.deactivateFloor(id, updatedBy) == 0) {
			throw new IllegalArgumentException("Floor not found or already inactive");
		}
		clearCache();
	}

	public List<MasterRecord> units(Long floorId) {
		return mapper.listUnits(floorId);
	}

	public MasterRecord saveUnit(Long floorId, MasterRecord request) {
		MasterRecord record = normalizeStructure(request, floorId, "Unit");
		record.parentId = floorId;
		if (record.id == null) {
			mapper.insertUnit(record);
		}
		else {
			mapper.updateUnit(record);
		}
		clearCache();
		return record;
	}

	public void deactivateUnit(Long id, Long updatedBy) {
		if (mapper.deactivateUnit(id, updatedBy) == 0) {
			throw new IllegalArgumentException("Unit not found or already inactive");
		}
		clearCache();
	}

	public List<MasterRecord> amenities(Long propertyId) {
		get(propertyId);
		return mapper.listAmenities(propertyId);
	}

	public MasterRecord saveAmenity(Long propertyId, MasterRecord request) {
		MasterRecord record = normalizeStructure(request, propertyId, "Amenity");
		record.parentId = propertyId;
		if (record.id == null) {
			mapper.insertAmenity(record);
		}
		else {
			mapper.updateAmenity(record);
		}
		clearCache();
		return record;
	}

	public void deactivateAmenity(Long id, Long updatedBy) {
		if (mapper.deactivateAmenity(id, updatedBy) == 0) {
			throw new IllegalArgumentException("Amenity not found or already inactive");
		}
		clearCache();
	}

	public List<WorkflowRow> workflow(Long propertyId) {
		get(propertyId);
		return mapper.listWorkflow(propertyId);
	}

	public WorkflowRow saveWorkflow(Long propertyId, WorkflowRow row) {
		get(propertyId);
		if (row == null) {
			throw new IllegalArgumentException("Workflow row is required");
		}
		row.propertyId = propertyId;
		row.stepCode = requireText(row.stepCode, "Step code is required").toUpperCase(Locale.ROOT);
		row.stepName = requireText(row.stepName, "Step name is required");
		row.state = defaultText(row.state, "PENDING").toUpperCase(Locale.ROOT);
		row.progressPercent = row.progressPercent == null ? 0 : Math.max(0, Math.min(row.progressPercent, 100));
		row.sortOrder = row.sortOrder == null ? 0 : row.sortOrder;
		mapper.upsertWorkflow(row);
		clearCache();
		return row;
	}

	public PropertyTreeNode tree(Long propertyId) {
		get(propertyId);
		List<PropertyTreeNode> properties = mapper.treeProperties(propertyId);
		if (properties.isEmpty()) {
			throw new IllegalArgumentException("Property not found");
		}
		PropertyTreeNode root = properties.get(0);
		Map<Long, PropertyTreeNode> blockMap = new LinkedHashMap<>();
		for (PropertyTreeNode block : mapper.treeBlocks(propertyId)) {
			blockMap.put(block.id, block);
			root.children.add(block);
		}
		Map<Long, PropertyTreeNode> floorMap = new LinkedHashMap<>();
		for (PropertyTreeNode floor : mapper.treeFloors(propertyId)) {
			floorMap.put(floor.id, floor);
			PropertyTreeNode block = blockMap.get(floor.parentId);
			if (block != null) {
				block.children.add(floor);
			}
		}
		for (PropertyTreeNode unit : mapper.treeUnits(propertyId)) {
			PropertyTreeNode floor = floorMap.get(unit.parentId);
			if (floor != null) {
				floor.children.add(unit);
			}
		}
		return root;
	}

	public PropertySummary summary(Long propertyId) {
		get(propertyId);
		PropertySummary summary = mapper.summary(propertyId);
		if (summary == null) {
			summary = new PropertySummary();
			summary.propertyId = propertyId;
			summary.blockCount = 0;
			summary.floorCount = 0;
			summary.unitCount = 0;
			summary.occupiedUnits = 0;
			summary.vacantUnits = 0;
			summary.reservedUnits = 0;
			summary.maintenanceUnits = 0;
			summary.amenityCount = 0;
		}
		return summary;
	}

	@Transactional(rollbackFor = Exception.class)
	private void seedWorkflow(Long propertyId, Long userId) {
		List<WorkflowRow> rows = new ArrayList<>();
		rows.add(workflowRow(propertyId, "PROFILE", "Property Profile", 20, "IN_PROGRESS", 10, userId));
		rows.add(workflowRow(propertyId, "OWNERSHIP", "Ownership", 0, "PENDING", 20, userId));
		rows.add(workflowRow(propertyId, "DOCUMENTS", "Documents", 0, "PENDING", 30, userId));
		rows.add(workflowRow(propertyId, "STRUCTURE", "Structure Setup", 0, "PENDING", 40, userId));
		rows.add(workflowRow(propertyId, "OPERATIONS", "Operations Setup", 0, "PENDING", 50, userId));
		for (WorkflowRow row : rows) {
			mapper.upsertWorkflow(row);
		}
	}

	private void saveOwnershipRows(Long propertyId, List<PropertyOwnershipRow> rows, Long userId) {
		if (rows == null) {
			return;
		}
		int sortOrder = 10;
		for (PropertyOwnershipRow row : rows) {
			if (row == null || isBlank(row.party) && isBlank(row.role) && isBlank(row.shareRight) && isBlank(row.reference)) {
				continue;
			}
			row.propertyId = propertyId;
			row.party = requireText(row.party, "Ownership party is required");
			row.role = defaultText(row.role, "Owner");
			row.shareRight = defaultText(row.shareRight, "100%");
			row.reference = trimToNull(row.reference);
			row.status = defaultText(row.status, "ACTIVE").toUpperCase(Locale.ROOT);
			row.sortOrder = row.sortOrder == null ? sortOrder : row.sortOrder;
			row.createdBy = row.createdBy == null ? userId : row.createdBy;
			row.updatedBy = row.updatedBy == null ? userId : row.updatedBy;
			mapper.upsertOwnershipRow(row);
			sortOrder += 10;
		}
	}

	private void saveDocumentRows(Long propertyId, List<PropertyDocumentRow> rows, Long userId) {
		if (rows == null) {
			return;
		}
		int sortOrder = 10;
		for (PropertyDocumentRow row : rows) {
			if (row == null || isBlank(row.document) && isBlank(row.category) && isBlank(row.reference)) {
				continue;
			}
			row.propertyId = propertyId;
			row.document = requireText(row.document, "Document name is required");
			row.category = defaultText(row.category, "Legal");
			row.reference = requireText(row.reference, "Document reference is required");
			row.updatedDate = trimToNull(row.updatedDate);
			row.status = defaultText(row.status, "ACTIVE").toUpperCase(Locale.ROOT);
			row.sortOrder = row.sortOrder == null ? sortOrder : row.sortOrder;
			row.createdBy = row.createdBy == null ? userId : row.createdBy;
			row.updatedBy = row.updatedBy == null ? userId : row.updatedBy;
			mapper.upsertDocumentRow(row);
			sortOrder += 10;
		}
	}

	private WorkflowRow workflowRow(Long propertyId, String code, String name, int progress, String state, int sortOrder, Long userId) {
		WorkflowRow row = new WorkflowRow();
		row.propertyId = propertyId;
		row.stepCode = code;
		row.stepName = name;
		row.progressPercent = progress;
		row.state = state;
		row.sortOrder = sortOrder;
		row.updatedBy = userId;
		return row;
	}

	private void normalizeProperty(PropertyMaster request) {
		if (request == null) {
			throw new IllegalArgumentException("Property is required");
		}
		if (request.companyId == null) {
			throw new IllegalArgumentException("Company is required");
		}
		request.code = requireText(request.code, "Property code is required").toUpperCase(Locale.ROOT);
		request.name = requireText(request.name, "Property name is required");
		request.propertyType = requireText(request.propertyType, "Property type is required").toUpperCase(Locale.ROOT);
		request.region = trimToNull(request.region);
		request.city = trimToNull(request.city);
		request.country = defaultText(request.country, "UAE");
	}

	private MasterRecord normalizeStructure(MasterRecord request, Long parentId, String label) {
		if (request == null) {
			throw new IllegalArgumentException(label + " is required");
		}
		if (parentId == null) {
			throw new IllegalArgumentException(label + " parent is required");
		}
		request.code = requireText(request.code, label + " code is required").toUpperCase(Locale.ROOT);
		request.name = requireText(request.name, label + " name is required");
		request.description = trimToNull(request.description);
		request.attributes = normalizeJson(request.attributes);
		if (!isBlank(request.status)) {
			request.status = request.status.trim().toUpperCase(Locale.ROOT);
		}
		request.sortOrder = request.sortOrder == null ? 0 : request.sortOrder;
		request.activeStatus = defaultText(request.activeStatus, "ACTIVE").toUpperCase(Locale.ROOT);
		return request;
	}

	private String normalizeJson(String attributes) {
		if (isBlank(attributes)) {
			return "{}";
		}
		try {
			JsonParser.parseString(attributes);
			return attributes.trim();
		}
		catch (RuntimeException ex) {
			throw new IllegalArgumentException("Attributes must be valid JSON");
		}
	}

	private String requireText(String value, String message) {
		if (isBlank(value)) {
			throw new IllegalArgumentException(message);
		}
		return value.trim();
	}

	private String defaultText(String value, String defaultValue) {
		return isBlank(value) ? defaultValue : value.trim();
	}

	private String trimToNull(String value) {
		return isBlank(value) ? null : value.trim();
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private void clearCache() {
		CacheHelper.clearCompanyCache();
		CacheHelper.clearShortLivedCache();
	}
}
