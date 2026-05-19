package com.eba.propertyconnect.propertymanagement.property.domain;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

public class PropertyMaster {

	public Long id;
	public Long companyId;
	public String code;
	public String name;
	public String description;
	public String propertyType;
	public String region;
	public String addressLine1;
	public String city;
	public String emirate;
	public String country;
	public String ownershipType;
	public String ownerName;
	public String titleDeedNo;
	public String reraPermitNo;
	public String documentReference;
	public String documentStatus;
	public List<PropertyOwnershipRow> ownershipRows;
	public List<PropertyDocumentRow> documentRows;
	public Integer totalBlocks;
	public Integer totalFloors;
	public Integer totalUnits;
	public Integer totalAmenities;
	public BigDecimal builtUpArea;
	public BigDecimal plotArea;
	public BigDecimal marketValue;
	public BigDecimal annualServiceCharge;
	public String operatingModel;
	public String facilityManager;
	public String onboardingStatus;
	public String activeStatus;
	public Long createdBy;
	public Date createdOn;
	public Long updatedBy;
	public Date updatedOn;
}
