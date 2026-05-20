package com.eba.propertyconnect.propertymanagement.legal.controller;

import java.time.LocalDate;

import com.eba.propertyconnect.propertymanagement.auth.service.TokenService;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCard;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardSearch;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalWorkflowRequest;
import com.eba.propertyconnect.propertymanagement.legal.service.LegalService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/propertymanagement/legal-management")
@ApplicationScoped
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LegalResource {

	private static final String CORE_USER_ID = "userId";
	private static final String CORE_CLIENT_ID = "clientId";
	private static final String CORE_COMPANY_ID = "companyId";
	private static final String CORE_SELECTED_COMPANY_ID = "selectedCompanyId";
	private static final String SESSION_SELECTED_COMPANY_ID = "propertyConnect.selectedCompanyId";
	private static final Gson GSON = new GsonBuilder()
			.setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
			.registerTypeAdapter(LocalDate.class, (com.google.gson.JsonSerializer<LocalDate>) (value, type, context) -> context.serialize(value.toString()))
			.create();

	@Inject
	private LegalService service;

	@Inject
	private TokenService tokenService;

	@Context
	private HttpServletRequest httpRequest;

	@GET
	@Path("/lookups")
	public Response lookups(@QueryParam("companyId") Long companyId, @QueryParam("clientId") Long clientId) {
		return ok(service.lookups(loggedCompanyId(companyId), loggedClientId(clientId)));
	}

	@GET
	@Path("/dashboard")
	public Response dashboard(@QueryParam("companyId") Long companyId, @QueryParam("clientId") Long clientId) {
		return ok(service.dashboard(loggedCompanyId(companyId), loggedClientId(clientId)));
	}

	@POST
	@Path("/legal-cards/search")
	public Response searchLegalCards(@QueryParam("clientId") Long clientId, LegalCardSearch request) {
		if (request == null) {
			request = new LegalCardSearch();
		}
		request.companyId = loggedCompanyId(request.companyId);
		return ok(service.searchLegalCards(request, loggedClientId(clientId)));
	}

	@GET
	@Path("/legal-cards/{id}")
	public Response getLegalCard(@PathParam("id") Long id, @QueryParam("companyId") Long companyId, @QueryParam("clientId") Long clientId) {
		return okOrBadRequest(() -> service.getLegalCard(id, optionalLoggedCompanyId(companyId), loggedClientId(clientId)));
	}

	@POST
	@Path("/legal-cards")
	public Response createLegalCard(@QueryParam("clientId") Long clientId, LegalCard request) {
		return created(() -> {
			request.companyId = loggedCompanyId(request.companyId);
			request.createdBy = loggedUserId(request.createdBy);
			return service.createLegalCard(request, loggedClientId(clientId));
		});
	}

	@PUT
	@Path("/legal-cards/{id}")
	public Response updateLegalCard(@PathParam("id") Long id, @QueryParam("clientId") Long clientId, LegalCard request) {
		return okOrBadRequest(() -> {
			request.companyId = loggedCompanyId(request.companyId);
			request.updatedBy = loggedUserId(request.updatedBy);
			return service.updateLegalCard(id, request.companyId, request, loggedClientId(clientId));
		});
	}

	@POST
	@Path("/legal-cards/{id}/workflow")
	public Response workflow(@PathParam("id") Long id, @QueryParam("companyId") Long companyId, @QueryParam("clientId") Long clientId, LegalWorkflowRequest request) {
		LegalWorkflowRequest payload = request == null ? new LegalWorkflowRequest() : request;
		return okOrBadRequest(() -> {
			payload.updatedBy = loggedUserId(payload.updatedBy);
			return service.workflow(id, optionalLoggedCompanyId(companyId), payload, loggedClientId(clientId));
		});
	}

	@POST
	@Path("/legal-cards/{id}/cancel")
	public Response cancel(@PathParam("id") Long id, @QueryParam("companyId") Long companyId, @QueryParam("clientId") Long clientId, LegalWorkflowRequest request) {
		LegalWorkflowRequest payload = request == null ? new LegalWorkflowRequest() : request;
		return okOrBadRequest(() -> {
			payload.updatedBy = loggedUserId(payload.updatedBy);
			return service.cancel(id, optionalLoggedCompanyId(companyId), payload, loggedClientId(clientId));
		});
	}

	private Response ok(Object body) {
		return Response.ok(GSON.toJson(body)).build();
	}

	private Response created(Action action) {
		return respond(action, Response.Status.CREATED);
	}

	private Response okOrBadRequest(Action action) {
		return respond(action, Response.Status.OK);
	}

	private Response respond(Action action, Response.Status successStatus) {
		try {
			return Response.status(successStatus).entity(GSON.toJson(action.run())).build();
		}
		catch (IllegalArgumentException ex) {
			return Response.status(Response.Status.BAD_REQUEST).entity(error(ex.getMessage())).build();
		}
		catch (IllegalStateException ex) {
			return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(error(ex.getMessage())).build();
		}
	}

	private String error(String message) {
		JsonObject error = new JsonObject();
		error.addProperty("message", message);
		return GSON.toJson(error);
	}

	private Long loggedUserId(Long requestUserId) {
		Long sessionUserId = userIdFromSession();
		if (sessionUserId != null) {
			return sessionUserId;
		}
		Long tokenUserId = userIdFromToken();
		if (tokenUserId != null) {
			return tokenUserId;
		}
		if (requestUserId != null) {
			return requestUserId;
		}
		throw new IllegalArgumentException("Logged user is required");
	}

	private Long loggedCompanyId(Long requestCompanyId) {
		Long companyId = optionalLoggedCompanyId(requestCompanyId);
		if (companyId != null) {
			return companyId;
		}
		throw new IllegalArgumentException("Logged company is required");
	}

	private Long optionalLoggedCompanyId(Long requestCompanyId) {
		HttpSession session = httpRequest == null ? null : httpRequest.getSession(false);
		if (session != null) {
			Long selectedCompanyId = toCompanyId(session.getAttribute(SESSION_SELECTED_COMPANY_ID));
			if (selectedCompanyId != null) {
				return selectedCompanyId;
			}
			selectedCompanyId = toCompanyId(session.getAttribute(CORE_SELECTED_COMPANY_ID));
			if (selectedCompanyId != null) {
				return selectedCompanyId;
			}
			Long companyId = toCompanyId(session.getAttribute(CORE_COMPANY_ID));
			if (companyId != null) {
				return companyId;
			}
		}
		if (requestCompanyId != null) {
			return requestCompanyId;
		}
		return null;
	}

	private Long loggedClientId(Long requestClientId) {
		HttpSession session = httpRequest == null ? null : httpRequest.getSession(false);
		if (session != null) {
			Long clientId = toCompanyId(session.getAttribute(CORE_CLIENT_ID));
			if (clientId != null) {
				return clientId;
			}
		}
		return requestClientId;
	}

	private Long userIdFromSession() {
		HttpSession session = httpRequest == null ? null : httpRequest.getSession(false);
		if (session == null) {
			return null;
		}
		return toUserId(session.getAttribute(CORE_USER_ID));
	}

	private Long userIdFromToken() {
		String userId = tokenService.authenticatedUserId(httpRequest == null ? null : httpRequest.getHeader("Authorization"));
		return toUserId(userId);
	}

	private Long toUserId(Object value) {
		return toLong(value, "Logged user id is invalid");
	}

	private Long toCompanyId(Object value) {
		return toLong(value, "Logged company id is invalid");
	}

	private Long toLong(Object value, String invalidMessage) {
		if (value instanceof Number number) {
			return number.longValue();
		}
		if (value instanceof String text && !text.isBlank()) {
			try {
				return Long.valueOf(text);
			}
			catch (NumberFormatException ex) {
				throw new IllegalArgumentException(invalidMessage);
			}
		}
		return null;
	}

	@FunctionalInterface
	private interface Action {
		Object run();
	}
}
