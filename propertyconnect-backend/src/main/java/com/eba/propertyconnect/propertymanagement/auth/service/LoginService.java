package com.eba.propertyconnect.propertymanagement.auth.service;

import java.util.ArrayList;
import java.util.List;

import com.eba.propertyconnect.propertymanagement.auth.domain.AuthenticatedUser;
import com.eba.propertyconnect.propertymanagement.auth.domain.CompanySelectionRequest;
import com.eba.propertyconnect.propertymanagement.auth.domain.CompanySelectionResponse;
import com.eba.propertyconnect.propertymanagement.auth.domain.CompanyMapping;
import com.eba.propertyconnect.propertymanagement.auth.domain.LoginRequest;
import com.eba.propertyconnect.propertymanagement.auth.domain.LoginResponse;
import com.eba.propertyconnect.propertymanagement.exception.AuthenticationException;
import com.eba.propertyconnect.propertymanagement.integration.coreconnect.client.CoreConnectAuthSoapClient;
import com.eba.propertyconnect.propertymanagement.util.ApplicationConfig;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class LoginService {

	private static final Gson GSON = new Gson();

	@Inject
	private CoreConnectAuthSoapClient erpAuthClient;

	@Inject
	private TokenService tokenService;

	public LoginResponse login(LoginRequest request) {
		validateRequest(request);
		JsonObject erpUserProfile = erpAuthClient.validateUserCredentials(request);
		AuthenticatedUser user = toAuthenticatedUser(erpUserProfile, request.getLoginId());
		List<CompanyMapping> companies = toCompanyMappings(erpAuthClient.getCompanyByUser(erpUserProfile));
		if (companies.isEmpty()) {
			companies = toCompanyMappings(erpUserProfile);
		}
		String token = tokenService.issueToken(user, request.isRememberMe());
		return new LoginResponse(token, user, companies, erpUserProfile);
	}

	public CompanySelectionResponse validateCompany(CompanySelectionRequest request) {
		if (request == null || request.getUserProfile() == null || request.getCompanyId() == null) {
			throw new AuthenticationException("User profile and company are required.");
		}
		JsonObject requestUserProfile = GSON.toJsonTree(request.getUserProfile()).getAsJsonObject();
		JsonObject loggedUserProfile = effectiveUserProfile(requestUserProfile);
		Integer clientId = request.getClientId() != null ? request.getClientId() : firstInteger(loggedUserProfile, "clientId");
		Integer userCompanyId = request.getUserCompanyId() != null ? request.getUserCompanyId() : firstInteger(loggedUserProfile, "companyId");
		Integer selectedCompanyId = request.getSelectedCompanyId() != null ? request.getSelectedCompanyId() : request.getCompanyId();
		JsonObject search = new JsonObject();
		addProperty(search, "userInterface", "P");
		addProperty(search, "clientId", clientId);
		addProperty(search, "companyId", request.getCompanyId());
		addProperty(search, "selectedCompanyId", selectedCompanyId);
		addProperty(search, "userCompanyId", userCompanyId);
		addProperty(search, "loggedInUserTimeZone", request.getLoggedInUserTimeZone());
		addProperty(search, "productId", ApplicationConfig.propertyConnectApplicationId());
		addProperty(search, "systemId", "null");
		JsonObject userProfile = erpAuthClient.validateUserCompany(loggedUserProfile, search);
		AuthenticatedUser user = toAuthenticatedUser(userProfile, firstString(loggedUserProfile, "loginId"));
		String token = tokenService.issueToken(user, true);
		return new CompanySelectionResponse(token, userProfile);
	}

	private void validateRequest(LoginRequest request) {
		if (request == null || ApplicationConfig.isBlank(request.getLoginId()) || ApplicationConfig.isBlank(request.getPassword())) {
			throw new AuthenticationException("Login ID and password are required.");
		}
		request.setLoginId(request.getLoginId().trim());
		if (!ApplicationConfig.isBlank(request.getImpersonateLoginId())) {
			request.setImpersonateLoginId(request.getImpersonateLoginId().trim());
		}
		if (ApplicationConfig.isBlank(request.getSuperUserPassword())) {
			request.setSuperUserPassword(null);
		}
		String[] loginParts = request.getLoginId().split("\\|_ILID_\\|", 2);
		request.setLoginId(loginParts[0]);
		if (loginParts.length > 1 && ApplicationConfig.isBlank(request.getImpersonateLoginId())) {
			request.setImpersonateLoginId(loginParts[1]);
		}
	}

	private void addProperty(JsonObject object, String name, Number value) {
		if (value != null) {
			object.addProperty(name, value);
		}
	}

	private void addProperty(JsonObject object, String name, String value) {
		if (!ApplicationConfig.isBlank(value)) {
			object.addProperty(name, value);
		}
	}

	private AuthenticatedUser toAuthenticatedUser(JsonObject profile, String loginId) {
		JsonObject userObject = firstObject(profile, "user", "loggedUser", "userProfile");
		String id = firstString(userObject, "id", "userId");
		if (ApplicationConfig.isBlank(id)) {
			id = firstString(profile, "id", "userId");
		}
		String name = firstString(userObject, "name", "userName", "loginId");
		if (ApplicationConfig.isBlank(name)) {
			name = firstString(profile, "name", "userName", "loginId");
		}
		String email = firstString(userObject, "email", "emailId");
		if (ApplicationConfig.isBlank(email)) {
			email = firstString(profile, "email", "emailId");
		}
		return new AuthenticatedUser(defaultValue(id, loginId), defaultValue(name, loginId), defaultValue(email, ""));
	}

	private List<CompanyMapping> toCompanyMappings(JsonObject profile) {
		List<CompanyMapping> companies = new ArrayList<>();
		JsonArray companyArray = firstArray(profile, "companies", "userCompanies", "companyList", "company");
		if (companyArray == null) {
			JsonObject singleCompany = firstObject(profile, "company");
			if (singleCompany != null) {
				companies.add(toCompanyMapping(singleCompany));
			}
			else if (profile != null && (profile.has("companyId") || profile.has("companyName"))) {
				companies.add(toCompanyMapping(profile));
			}
			return companies;
		}
		for (JsonElement element : companyArray) {
			if (element != null && element.isJsonObject()) {
				companies.add(toCompanyMapping(element.getAsJsonObject()));
			}
		}
		return companies;
	}

	private List<CompanyMapping> toCompanyMappings(JsonArray companyArray) {
		List<CompanyMapping> companies = new ArrayList<>();
		if (companyArray == null) {
			return companies;
		}
		for (JsonElement element : companyArray) {
			if (element != null && element.isJsonObject()) {
				companies.add(toCompanyMapping(element.getAsJsonObject()));
			}
		}
		return companies;
	}

	private CompanyMapping toCompanyMapping(JsonObject company) {
		String id = firstString(company, "id", "companyId");
		String code = firstString(company, "code", "companyCode", "externalId");
		String name = firstString(company, "name", "companyName", "description", "localDescription", "externalId");
		Integer clientId = firstInteger(company, "clientId");
		Integer companyId = firstInteger(company, "companyId", "id");
		Integer selectedCompanyId = firstInteger(company, "selectedCompanyId");
		Integer userCompanyId = firstInteger(company, "userCompanyId");
		Integer groupId = firstInteger(company, "groupId");
		String timeZone = firstString(company, "timeZone", "timezone");
		return new CompanyMapping(
			defaultValue(id, ""),
			defaultValue(code, ""),
			defaultValue(name, defaultValue(code, id)),
			clientId,
			companyId,
			selectedCompanyId,
			userCompanyId,
			groupId,
			timeZone);
	}

	private JsonObject firstObject(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && source.get(name).isJsonObject()) {
				return source.getAsJsonObject(name);
			}
		}
		return null;
	}

	private JsonObject effectiveUserProfile(JsonObject source) {
		JsonObject nestedProfile = firstObject(source, "userProfile", "loggedUserProfile", "loggedUser", "user");
		return nestedProfile == null ? source : nestedProfile;
	}

	private JsonArray firstArray(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && source.get(name).isJsonArray()) {
				return source.getAsJsonArray(name);
			}
		}
		return null;
	}

	private String firstString(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && !source.get(name).isJsonNull()) {
				return source.get(name).getAsString();
			}
		}
		return null;
	}

	private Integer firstInteger(JsonObject source, String... names) {
		String value = firstString(source, names);
		if (ApplicationConfig.isBlank(value)) {
			return null;
		}
		try {
			return Integer.valueOf(value);
		}
		catch (NumberFormatException ex) {
			return null;
		}
	}

	private String defaultValue(String value, String fallback) {
		return ApplicationConfig.isBlank(value) ? fallback : value;
	}
}
