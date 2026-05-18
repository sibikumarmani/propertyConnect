package com.eba.propertyconnect.propertymanagement.legal.domain;

public class LegalCardAttachment extends LegalAuditModel {

	public Long id;
	public Long legalCardId;
	public Long documentTypeId;
	public String documentType;
	public String fileName;
	public String contentType;
	public String storagePath;
}
