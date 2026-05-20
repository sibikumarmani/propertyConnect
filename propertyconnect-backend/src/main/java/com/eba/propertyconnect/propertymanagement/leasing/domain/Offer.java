package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;

public class Offer extends AuditModel {

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
	public String offerNo;
	public BigDecimal baseAmount;
	public BigDecimal discountAmount;
	public BigDecimal finalAmount;
	public String specialTerms;
	public Integer status;
	public Boolean approvalRequired;
}
