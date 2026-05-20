package com.eba.propertyconnect.propertymanagement.property.domain;

import java.util.Date;

public class MasterRecord {

	public Long id;
	public Long companyId;
	public String code;
	public String name;
	public String description;
	public Long propertyId;
	public Long parentId;
	public Integer sortOrder;
	public String attributes;
	public String status;
	public String activeStatus;
	public Date activeFrom;
	public Date activeTo;
	public Long createdBy;
	public Date createdOn;
	public Long updatedBy;
	public Date updatedOn;
}
