package com.eba.propertyconnect.propertymanagement.leasing.domain;

public class Lead extends AuditModel {

	public Long id;
	public Long companyId;
	public String leadNo;
	public Long customerId;
	public String customerCode;
	public String customerType;
	public String customerName;
	public String contactPerson;
	public String mobileNo;
	public String email;
	public String preferredContactMethod;
	public String purpose;
	public String status;
	public Integer qualificationScore;
	public String qualificationNotes;
}
