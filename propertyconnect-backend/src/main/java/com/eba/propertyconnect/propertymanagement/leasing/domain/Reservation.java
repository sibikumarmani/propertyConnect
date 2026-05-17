package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;
import java.util.Date;

public class Reservation extends AuditModel {

	public Long id;
	public Long companyId;
	public String reservationNo;
	public Long leadId;
	public Long prospectId;
	public Long offerId;
	public Long propertyId;
	public Long unitId;
	public String status;
	public String approvalStatus;
	public BigDecimal reservationFee;
	public BigDecimal paidAmount;
	public Boolean paymentWaived;
	public Date expiresAt;
}
