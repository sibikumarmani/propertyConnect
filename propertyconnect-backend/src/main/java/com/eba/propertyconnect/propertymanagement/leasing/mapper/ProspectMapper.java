package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Prospect;

@Mapper
public interface ProspectMapper {

	public List<Prospect> listProspects(@Param("companyId") Long companyId);

	public Prospect getProspect(Long id);

	public Prospect getProspectByLead(Long leadId);

	public int createProspect(Prospect prospect);

	public int updateProspectStatus(@Param("id") Long id, @Param("status") String status, @Param("updatedBy") Long updatedBy);
}
