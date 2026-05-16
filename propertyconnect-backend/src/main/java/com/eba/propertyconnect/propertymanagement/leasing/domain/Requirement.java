package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Requirement extends AuditModel {

	public Long id;
	public Long prospectId;
	public Long propertyId;
	public String propertyName;
	public String unitType;
	public Integer bedrooms;
	public BigDecimal budgetFrom;
	public BigDecimal budgetTo;
	public LocalDate moveInDate;
	public String notes;
}
