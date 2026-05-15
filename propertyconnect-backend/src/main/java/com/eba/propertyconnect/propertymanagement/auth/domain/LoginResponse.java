package com.eba.propertyconnect.propertymanagement.auth.domain;

import java.util.List;

import com.google.gson.JsonObject;

public record LoginResponse(String token, AuthenticatedUser user, List<CompanyMapping> companies, JsonObject userProfile) {
}
