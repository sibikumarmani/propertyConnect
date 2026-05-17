package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.util.List;

import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Requirement;

@Mapper
public interface RequirementMapper {

	public int saveRequirement(Requirement requirement);

	public Requirement getRequirement(Long id);

	public List<Requirement> listRequirementsByProspect(Long prospectId);

	public int updateRequirement(Requirement requirement);
}
