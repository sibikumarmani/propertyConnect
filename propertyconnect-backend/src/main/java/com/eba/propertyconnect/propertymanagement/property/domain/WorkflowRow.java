package com.eba.propertyconnect.propertymanagement.property.domain;

import java.util.Date;

public class WorkflowRow {

	public Long id;
	public Long propertyId;
	public String stepCode;
	public String stepName;
	public String ownerName;
	public Integer progressPercent;
	public String state;
	public Integer sortOrder;
	public Long updatedBy;
	public Date updatedOn;
}
