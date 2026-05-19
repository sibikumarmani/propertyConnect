package com.eba.propertyconnect.propertymanagement.property.service;

import java.util.Date;
import java.util.List;
import java.util.Locale;

import com.eba.propertyconnect.propertymanagement.property.domain.MasterRecord;
import com.eba.propertyconnect.propertymanagement.property.domain.MasterType;
import com.eba.propertyconnect.propertymanagement.property.mapper.MasterMapper;
import com.eba.propertyconnect.propertymanagement.util.CacheHelper;
import com.google.gson.JsonParser;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class MasterService {

	private static final String CACHE_SCOPE = "property-master";

	@Inject
	private MasterMapper mapper;

	public List<MasterRecord> list(String typeCode, Long companyId, boolean includeInactive) {
		MasterType type = MasterType.fromCode(typeCode);
		return mapper.list(type.tableName(), companyId, includeInactive);
	}

	public MasterRecord create(String typeCode, MasterRecord request) {
		MasterType type = MasterType.fromCode(typeCode);
		MasterRecord record = normalize(type, request);
		MasterRecord duplicate = mapper.getByCode(type.tableName(), record.companyId, record.code);
		if (duplicate != null) {
			throw new IllegalArgumentException("Code already exists for " + type.code());
		}
		mapper.insert(type.tableName(), record);
		clearCache();
		return mapper.get(type.tableName(), record.id);
	}

	public MasterRecord update(String typeCode, Long id, MasterRecord request) {
		MasterType type = MasterType.fromCode(typeCode);
		if (mapper.get(type.tableName(), id) == null) {
			throw new IllegalArgumentException("Master record not found");
		}
		MasterRecord record = normalize(type, request);
		record.id = id;
		mapper.update(type.tableName(), record);
		clearCache();
		return mapper.get(type.tableName(), id);
	}

	public void deactivate(String typeCode, Long id, Long updatedBy) {
		MasterType type = MasterType.fromCode(typeCode);
		if (mapper.deactivate(type.tableName(), id, updatedBy) == 0) {
			throw new IllegalArgumentException("Master record not found or already inactive");
		}
		clearCache();
	}

	private MasterRecord normalize(MasterType type, MasterRecord request) {
		if (request == null) {
			throw new IllegalArgumentException("Master record is required");
		}
		request.code = requireText(request.code, "Code is required").toUpperCase(Locale.ROOT);
		request.name = requireText(request.name, "Name is required");
		if (type.parentRequired() && request.parentId == null) {
			throw new IllegalArgumentException(type.code() + " parent is required");
		}
		request.description = trimToNull(request.description);
		request.attributes = normalizeJson(request.attributes);
		request.sortOrder = request.sortOrder == null ? 0 : request.sortOrder;
		request.activeStatus = normalizeActiveStatus(request.activeStatus);
		request.activeFrom = request.activeFrom == null ? new Date() : request.activeFrom;
		return request;
	}

	private String normalizeActiveStatus(String value) {
		String normalized = isBlank(value) ? "Y" : value.trim().toUpperCase(Locale.ROOT);
		if ("ACTIVE".equals(normalized) || "YES".equals(normalized) || "TRUE".equals(normalized) || "1".equals(normalized)) {
			return "Y";
		}
		if ("INACTIVE".equals(normalized) || "NO".equals(normalized) || "FALSE".equals(normalized) || "0".equals(normalized)) {
			return "N";
		}
		if ("Y".equals(normalized) || "N".equals(normalized)) {
			return normalized;
		}
		throw new IllegalArgumentException("Active status must be Y or N");
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
