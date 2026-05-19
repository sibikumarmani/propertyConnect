package com.eba.propertyconnect.propertymanagement.auth.domain;

import java.util.List;

import com.google.gson.JsonObject;

public record SessionResponse(
		boolean authenticated,
		AuthenticatedUser user,
		List<CompanyMapping> companies,
		JsonObject userProfile,
		Integer selectedCompanyId) {
}
