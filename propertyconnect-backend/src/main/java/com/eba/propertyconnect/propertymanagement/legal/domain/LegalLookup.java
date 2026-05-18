package com.eba.propertyconnect.propertymanagement.legal.domain;

public class LegalLookup {

	public Long id;
	public String code;
	public String label;

	public LegalLookup() {
	}

	public LegalLookup(Long id, String code, String label) {
		this.id = id;
		this.code = code;
		this.label = label;
	}
}
