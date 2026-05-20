package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.util.Date;

public class SiteVisit extends AuditModel {

	public Long id;
	public Long companyId;
	public Long prospectId;
	public Long propertyId;
	public String propertyName;
	public Integer requirementLevel;
	public Long blockId;
	public String blockName;
	public Long floorId;
	public String floorName;
	public Long unitId;
	public Date visitAt;
	public Integer status;
	public String notes;
}
