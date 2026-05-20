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
	public Long blockId;
	public Long floorId;
	public Long unitId;
	public Integer status;
	public Integer approvalStatus;
	public BigDecimal reservationFee;
	public BigDecimal paidAmount;
	public Boolean paymentWaived;
	public Date expiresAt;
}
