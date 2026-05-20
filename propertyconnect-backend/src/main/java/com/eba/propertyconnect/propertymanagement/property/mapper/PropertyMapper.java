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

	public PropertyMaster getProperty(@Param("id") Long id);

	public PropertyMaster getPropertyByCode(@Param("companyId") Long companyId, @Param("code") String code);

	public int insertProperty(PropertyMaster property);

	public int updatePropertyProfile(PropertyMaster property);

	public int updatePropertyDocuments(PropertyMaster property);

	public int updatePropertyOperatingModel(PropertyMaster property);

	public List<PropertyOwnershipRow> listOwnershipRows(@Param("propertyId") Long propertyId);

	public int upsertOwnershipRow(PropertyOwnershipRow row);

	public int deactivateOwnershipRows(@Param("propertyId") Long propertyId, @Param("updatedBy") Long updatedBy);

	public List<PropertyDocumentRow> listDocumentRows(@Param("propertyId") Long propertyId);

	public int upsertDocumentRow(PropertyDocumentRow row);

	public int deactivateDocumentRows(@Param("propertyId") Long propertyId, @Param("updatedBy") Long updatedBy);

	public List<MasterRecord> listBlocks(@Param("propertyId") Long propertyId);

	public List<MasterRecord> listFloors(@Param("blockId") Long blockId);

	public List<MasterRecord> listCompanyUnits(Long companyId);

	public List<MasterRecord> listUnits(@Param("floorId") Long floorId);

	public List<MasterRecord> listAmenities(@Param("propertyId") Long propertyId);

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

	public List<WorkflowRow> listWorkflow(@Param("propertyId") Long propertyId);

	public int upsertWorkflow(WorkflowRow row);

	public List<PropertyTreeNode> treeProperties(@Param("propertyId") Long propertyId);

	public List<PropertyTreeNode> treeBlocks(@Param("propertyId") Long propertyId);

	public List<PropertyTreeNode> treeFloors(@Param("propertyId") Long propertyId);

	public List<PropertyTreeNode> treeUnits(@Param("propertyId") Long propertyId);

	public PropertySummary summary(@Param("propertyId") Long propertyId);
}
