package com.eba.propertyconnect.propertymanagement.auth.domain;

import com.google.gson.JsonObject;

public record CompanySelectionResponse(String token, JsonObject userProfile) {
}
