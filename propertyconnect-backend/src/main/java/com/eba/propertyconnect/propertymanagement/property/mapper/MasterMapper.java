package com.eba.propertyconnect.propertymanagement.property.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.property.domain.MasterRecord;

@Mapper
public interface MasterMapper {

	public List<MasterRecord> list(@Param("tableName") String tableName, @Param("companyId") Long companyId,
			@Param("includeInactive") boolean includeInactive);

	public MasterRecord get(@Param("tableName") String tableName, @Param("id") Long id);

	public MasterRecord getByCode(@Param("tableName") String tableName, @Param("companyId") Long companyId, @Param("code") String code);

	public int insert(@Param("tableName") String tableName, @Param("record") MasterRecord record);

	public int update(@Param("tableName") String tableName, @Param("record") MasterRecord record);

	public int deactivate(@Param("tableName") String tableName, @Param("id") Long id, @Param("updatedBy") Long updatedBy);
}
