package com.eba.propertyconnect.propertymanagement.auth.domain;

public record CompanyMapping(
	String id,
	String code,
	String name,
	Integer clientId,
	Integer companyId,
	Integer selectedCompanyId,
	Integer userCompanyId,
	Integer groupId,
	String timeZone) {
}
