package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.util.Date;

public class SiteVisit extends AuditModel {

	public Long id;
	public Long companyId;
	public Long prospectId;
	public Long propertyId;
	public String propertyName;
	public String requirementLevel;
	public String blockName;
	public String floorName;
	public Long unitId;
	public Date visitAt;
	public String status;
	public String notes;
}
