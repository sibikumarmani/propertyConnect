package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;

public class Negotiation extends AuditModel {

	public Long id;
	public Long offerId;
	public BigDecimal proposedAmount;
	public String notes;
	public String status;
}
