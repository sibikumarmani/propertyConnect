package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;

public class Offer extends AuditModel {

	public Long id;
	public Long companyId;
	public Long prospectId;
	public Long propertyId;
	public String propertyName;
	public String requirementLevel;
	public String blockName;
	public String floorName;
	public Long unitId;
	public String offerNo;
	public BigDecimal baseAmount;
	public BigDecimal discountAmount;
	public BigDecimal finalAmount;
	public String specialTerms;
	public String status;
	public Boolean approvalRequired;
}
