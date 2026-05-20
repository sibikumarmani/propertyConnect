package com.eba.propertyconnect.propertymanagement.property.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.property.domain.MasterRecord;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyDocumentRow;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyMaster;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyOwnershipRow;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertySearch;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertySummary;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyTreeNode;
import com.eba.propertyconnect.propertymanagement.property.domain.WorkflowRow;

@Mapper
public interface PropertyMapper {

	public List<PropertyMaster> listProperties(PropertySearch search);

	public PropertyMaster getProperty(Long id);

	public PropertyMaster getPropertyByCode(@Param("companyId") Long companyId, @Param("code") String code);

	public int insertProperty(PropertyMaster property);

	public int updatePropertyProfile(PropertyMaster property);

	public int updatePropertyDocuments(PropertyMaster property);

	public int updatePropertyOperatingModel(PropertyMaster property);

	public List<PropertyOwnershipRow> listOwnershipRows(Long propertyId);

	public int upsertOwnershipRow(PropertyOwnershipRow row);

	public List<PropertyDocumentRow> listDocumentRows(Long propertyId);

	public int upsertDocumentRow(PropertyDocumentRow row);

	public List<MasterRecord> listBlocks(Long propertyId);

	public List<MasterRecord> listFloors(Long blockId);

	public List<MasterRecord> listUnits(Long floorId);

	public List<MasterRecord> listCompanyUnits(Long companyId);

	public List<MasterRecord> listAmenities(Long propertyId);

	public int insertBlock(MasterRecord record);

	public int updateBlock(MasterRecord record);

	public int deactivateBlock(@Param("id") Long id, @Param("updatedBy") Long updatedBy);

	public int insertFloor(MasterRecord record);

	public int updateFloor(MasterRecord record);

	public int deactivateFloor(@Param("id") Long id, @Param("updatedBy") Long updatedBy);

	public int insertUnit(MasterRecord record);

	public int updateUnit(MasterRecord record);

	public int deactivateUnit(@Param("id") Long id, @Param("updatedBy") Long updatedBy);

	public int insertAmenity(MasterRecord record);

	public int updateAmenity(MasterRecord record);

	public int deactivateAmenity(@Param("id") Long id, @Param("updatedBy") Long updatedBy);

	public List<WorkflowRow> listWorkflow(Long propertyId);

	public int upsertWorkflow(WorkflowRow row);

	public List<PropertyTreeNode> treeProperties(Long propertyId);

	public List<PropertyTreeNode> treeBlocks(Long propertyId);

	public List<PropertyTreeNode> treeFloors(Long propertyId);

	public List<PropertyTreeNode> treeUnits(Long propertyId);

	public PropertySummary summary(Long propertyId);
}
