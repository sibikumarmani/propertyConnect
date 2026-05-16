package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.util.Date;

public class SiteVisit extends AuditModel {

	public Long id;
	public Long prospectId;
	public Long unitId;
	public Date visitAt;
	public String status;
	public String notes;
}
