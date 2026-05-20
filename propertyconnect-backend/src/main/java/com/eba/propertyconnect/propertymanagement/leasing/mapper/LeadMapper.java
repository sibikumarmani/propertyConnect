package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Lead;

@Mapper
public interface LeadMapper {

	public List<Lead> listLeads(@Param("companyId") Long companyId);

	public Lead getLead(Long id);

	public int createLead(Lead lead);

	public int updateLead(Lead lead);

	public int qualifyLead(@Param("id") Long id, @Param("status") Integer status, @Param("score") Integer score, @Param("notes") String notes, @Param("updatedBy") Long updatedBy);

	public int updateLeadStatus(@Param("id") Long id, @Param("status") Integer status, @Param("updatedBy") Long updatedBy);
}
