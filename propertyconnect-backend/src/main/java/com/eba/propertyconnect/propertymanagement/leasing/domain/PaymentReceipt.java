package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.math.BigDecimal;
import java.util.Date;

public class PaymentReceipt extends AuditModel {

	public Long id;
	public Long reservationId;
	public String receiptNo;
	public BigDecimal amount;
	public String paymentMethod;
	public Date paidAt;
	public Long erpReceiptId;
}
