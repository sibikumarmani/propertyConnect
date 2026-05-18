package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Requirement extends AuditModel {

	public Long id;
	public Long companyId;
	public Long prospectId;
	public Long propertyId;
	public String propertyName;
	public String requirementLevel;
	public String blockName;
	public String floorName;
	public Long preferredUnitId;
	public String unitType;
	public Integer bedrooms;
	public BigDecimal areaFrom;
	public BigDecimal areaTo;
	public BigDecimal budgetFrom;
	public BigDecimal budgetTo;
	public LocalDate moveInDate;
	public Integer leaseTermMonths;
	public String usageType;
	public Boolean parkingRequired;
	public Boolean fitOutRequired;
	public String specialRequirements;
	public String notes;
}
