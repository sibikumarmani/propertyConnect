package com.eba.propertyconnect.propertymanagement.leasing.domain;

public class Lead extends AuditModel {

	public Long id;
	public Long companyId;
	public String leadNo;
	public String customerName;
	public String mobileNo;
	public String email;
	public String source;
	public String purpose;
	public String status;
	public Integer qualificationScore;
	public String qualificationNotes;
}
