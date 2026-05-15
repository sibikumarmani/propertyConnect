package com.eba.propertyconnect.propertymanagement.auth.controller;

import java.util.List;

import com.eba.propertyconnect.propertymanagement.auth.domain.CompanyMapping;
import com.eba.propertyconnect.propertymanagement.auth.domain.CompanySelectionRequest;
import com.eba.propertyconnect.propertymanagement.auth.domain.CompanySelectionResponse;
import com.eba.propertyconnect.propertymanagement.auth.domain.LoginRequest;
import com.eba.propertyconnect.propertymanagement.auth.domain.LoginResponse;
import com.eba.propertyconnect.propertymanagement.auth.service.LoginService;
import com.eba.propertyconnect.propertymanagement.exception.AuthenticationException;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@ApplicationScoped
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

	private static final Gson GSON = new Gson();
	private static final String SESSION_USER = "propertyConnect.user";
	private static final String SESSION_USER_PROFILE = "propertyConnect.userProfile";
	private static final String SESSION_COMPANIES = "propertyConnect.companies";
	private static final String SESSION_SELECTED_COMPANY_ID = "propertyConnect.selectedCompanyId";
	private static final String SESSION_SELECTED_COMPANY_TIMEZONE = "propertyConnect.selectedCompanyTimeZone";
	private static final String SESSION_SELECTED_GROUP_COMPANY_ID = "propertyConnect.selectedGroupCompanyId";
	private static final String SESSION_SELECTED_COMPANY_PROFILE = "propertyConnect.selectedCompanyUserProfile";
	private static final String CORE_ALLOWED_COMPANY_IDS = "allowedCompanyIds";
	private static final String CORE_CLIENT_CODE = "clientCode";
	private static final String CORE_CLIENT_ID = "clientId";
	private static final String CORE_COMPANY_ID = "companyId";
	private static final String CORE_ENTITY_ID = "entityId";
	private static final String CORE_ENTITY_TYPE = "entityType";
	private static final String CORE_FORCE_UPDATE_PROFILE = "forceUpdateProfile";
	private static final String CORE_HAS_MIGRATION = "hasMigration";
	private static final String CORE_INTERNAL_SESSION_ID = "internalSessionId";
	private static final String CORE_LOGGED_IN_USER_TIME_ZONE = "loginUserTimeZone";
	private static final String CORE_SELECTED_COMPANY_ID = "selectedCompanyId";
	private static final String CORE_SELECTED_COMPANY_TIMEZONE = "selectedCompanyTimeZone";
	private static final String CORE_SELECTED_GROUP_COMPANY_ID = "selectedGroupCompanyId";
	private static final String CORE_SUPER_USER_ID = "super_user_id";
	private static final String CORE_TYPE = "type";
	private static final String CORE_USER_CATEGORY = "userCategory";
	private static final String CORE_USER_ID = "userId";
	private static final String CORE_USER_LOGIN_ID = "userLoginId";
	private static final String CORE_USER_NAME = "userName";
	private static final String CORE_USER_PROFILE = "userProfile";

	@Inject
	private LoginService loginService;

	@Context
	private HttpServletRequest httpRequest;

	@POST
	@Path("/login")
	public Response login(LoginRequest request) {
		try {
			LoginResponse response = loginService.login(request);
			HttpSession session = httpRequest.getSession(true);
			session.setAttribute(SESSION_USER, response.user());
			session.setAttribute(SESSION_USER_PROFILE, response.userProfile());
			session.setAttribute(SESSION_COMPANIES, response.companies());
			storeLoginSession(session, response);
			return Response.ok(GSON.toJson(response)).build();
		}
		catch (AuthenticationException ex) {
			return Response.status(Response.Status.UNAUTHORIZED).entity(error(ex.getMessage())).build();
		}
	}

	@POST
	@Path("/company")
	public Response validateCompany(CompanySelectionRequest request) {
		try {
			CompanySelectionResponse response = loginService.validateCompany(request);
			HttpSession session = httpRequest.getSession(true);
			session.setAttribute(SESSION_SELECTED_COMPANY_ID, request.getCompanyId());
			session.setAttribute(SESSION_SELECTED_COMPANY_TIMEZONE, request.getSelectedCompanyTimeZone());
			session.setAttribute(SESSION_SELECTED_GROUP_COMPANY_ID, request.getSelectedGroupCompanyId());
			session.setAttribute(SESSION_USER_PROFILE, response.userProfile());
			session.setAttribute(SESSION_SELECTED_COMPANY_PROFILE, response.userProfile());
			storeCompanySelectionSession(session, request, response.userProfile());
			return Response.ok(GSON.toJson(response)).build();
		}
		catch (AuthenticationException ex) {
			return Response.status(Response.Status.UNAUTHORIZED).entity(error(ex.getMessage())).build();
		}
	}

	private String error(String message) {
		JsonObject error = new JsonObject();
		error.addProperty("message", message);
		return GSON.toJson(error);
	}

	private void storeLoginSession(HttpSession session, LoginResponse response) {
		JsonObject profile = response.userProfile();
		session.setAttribute(CORE_TYPE, "E");
		putIfPresent(session, CORE_USER_LOGIN_ID, firstValue(profile, "loginId"));
		putIfPresent(session, CORE_USER_ID, firstValue(profile, "id", "userId"));
		session.setAttribute(CORE_USER_PROFILE, profile);
		putIfPresent(session, CORE_SUPER_USER_ID, firstValue(profile, "superUserId"));
		putIfPresent(session, CORE_COMPANY_ID, firstValue(profile, "companyId"));
		putIfPresent(session, CORE_USER_NAME, firstValue(profile, "name", "userName", "loginId"));
		putIfPresent(session, CORE_USER_CATEGORY, firstValue(profile, "userCategory"));
		putIfPresent(session, CORE_ENTITY_TYPE, firstValue(profile, "entityType"));
		putIfPresent(session, CORE_ENTITY_ID, firstValue(profile, "entityId"));
		putIfPresent(session, CORE_CLIENT_ID, firstValue(profile, "clientId"));
		putIfPresent(session, CORE_CLIENT_CODE, firstValue(profile, "clientCode", "clientExternalId"));
		putIfPresent(session, CORE_FORCE_UPDATE_PROFILE, firstValue(firstObject(profile, "securityPolicyInfo"), "updateProfile"));
		session.setAttribute(CORE_HAS_MIGRATION, "N");
		session.removeAttribute(CORE_SELECTED_COMPANY_ID);
		session.removeAttribute(CORE_SELECTED_GROUP_COMPANY_ID);
		session.removeAttribute(CORE_SELECTED_COMPANY_TIMEZONE);
		putIfPresent(session, CORE_ALLOWED_COMPANY_IDS, allowedCompanyIds(response.companies()));
	}

	private void storeCompanySelectionSession(HttpSession session, CompanySelectionRequest request, JsonObject profile) {
		session.setAttribute(CORE_SELECTED_COMPANY_ID, request.getCompanyId());
		putIfPresent(session, CORE_SELECTED_COMPANY_TIMEZONE, request.getSelectedCompanyTimeZone());
		putIfPresent(session, CORE_SELECTED_GROUP_COMPANY_ID, request.getSelectedGroupCompanyId());
		putIfPresent(session, CORE_INTERNAL_SESSION_ID, firstValue(firstObject(profile, "sessionInfo"), "id"));
		putIfPresent(session, CORE_LOGGED_IN_USER_TIME_ZONE, request.getLoggedInUserTimeZone());
		session.setAttribute(CORE_USER_PROFILE, profile);
	}

	private String allowedCompanyIds(List<CompanyMapping> companies) {
		if (companies == null || companies.isEmpty()) {
			return null;
		}
		StringBuilder value = new StringBuilder();
		for (CompanyMapping company : companies) {
			Integer companyId = company.companyId();
			if (companyId == null) {
				continue;
			}
			if (value.length() > 0) {
				value.append(',');
			}
			value.append(companyId);
		}
		return value.length() == 0 ? null : value.toString();
	}

	private void putIfPresent(HttpSession session, String name, Object value) {
		if (value != null) {
			session.setAttribute(name, value);
		}
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

	private Object firstValue(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && !source.get(name).isJsonNull()) {
				return jsonValue(source.get(name));
			}
		}
		return null;
	}

	private Object jsonValue(JsonElement element) {
		if (element == null || element.isJsonNull()) {
			return null;
		}
		if (!element.isJsonPrimitive()) {
			return element;
		}
		if (element.getAsJsonPrimitive().isBoolean()) {
			return element.getAsBoolean();
		}
		if (element.getAsJsonPrimitive().isNumber()) {
			return element.getAsNumber();
		}
		return element.getAsString();
	}
}
