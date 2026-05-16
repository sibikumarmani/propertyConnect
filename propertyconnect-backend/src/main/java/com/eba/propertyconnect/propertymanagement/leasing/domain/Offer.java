package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;

public class Offer extends AuditModel {

	public Long id;
	public Long prospectId;
	public Long unitId;
	public String offerNo;
	public BigDecimal baseAmount;
	public BigDecimal discountAmount;
	public BigDecimal finalAmount;
	public String specialTerms;
	public String status;
	public Boolean approvalRequired;
}
