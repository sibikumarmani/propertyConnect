package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;

public class Unit extends AuditModel {

	public Long id;
	public Long propertyId;
	public String propertyName;
	public String unitCode;
	public String unitType;
	public Integer bedrooms;
	public BigDecimal askingRent;
	public String status;
}
