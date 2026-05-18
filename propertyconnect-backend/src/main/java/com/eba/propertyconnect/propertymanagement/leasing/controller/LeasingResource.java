package com.eba.propertyconnect.propertymanagement.leasing.controller;

import java.time.LocalDate;

import com.eba.propertyconnect.propertymanagement.auth.service.TokenService;
import com.eba.propertyconnect.propertymanagement.leasing.domain.ApprovalRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Lead;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Negotiation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Offer;
import com.eba.propertyconnect.propertymanagement.leasing.domain.OfferStatusRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.PaymentReceipt;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Prospect;
import com.eba.propertyconnect.propertymanagement.leasing.domain.QualificationRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Requirement;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Reservation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.ReservationStatusRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.SiteVisit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Unit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.UnitSearch;
import com.eba.propertyconnect.propertymanagement.leasing.service.LeasingService;
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

@Path("/propertymanagement/customer-management")
@ApplicationScoped
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LeasingResource {

	private static final String CORE_USER_ID = "userId";
	private static final Gson GSON = new GsonBuilder()
			.setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
			.registerTypeAdapter(LocalDate.class, (com.google.gson.JsonSerializer<LocalDate>) (value, type, context) -> context.serialize(value.toString()))
			.create();

	@Inject
	private LeasingService service;

	@Inject
	private TokenService tokenService;

	@Context
	private HttpServletRequest httpRequest;

	@GET
	@Path("/customers")
	public Response searchCustomers(@QueryParam("companyId") Long companyId, @QueryParam("search") String search) {
		return ok(service.searchCustomers(companyId, search));
	}

	@GET
	@Path("/leads")
	public Response listLeads(@QueryParam("companyId") Long companyId) {
		return ok(service.listLeads(companyId));
	}

	@POST
	@Path("/leads")
	public Response createLead(Lead request) {
		return created(() -> {
			request.createdBy = loggedUserId(request.createdBy);
			return service.createLead(request);
		});
	}

	@PUT
	@Path("/leads/{id}")
	public Response updateLead(@PathParam("id") Long id, Lead request) {
		return okOrBadRequest(() -> service.updateLead(id, request));
	}

	@POST
	@Path("/leads/{id}/qualify")
	public Response qualifyLead(@PathParam("id") Long id, QualificationRequest request) {
		return okOrBadRequest(() -> service.qualifyLead(id, request));
	}

	@POST
	@Path("/leads/{id}/convert-to-prospect")
	public Response convertLead(@PathParam("id") Long id, @QueryParam("createdBy") Long createdBy, Prospect request) {
		return okOrBadRequest(() -> service.convertLeadToProspect(id, createdBy, request));
	}

	@GET
	@Path("/prospects")
	public Response listProspects(@QueryParam("companyId") Long companyId) {
		return ok(service.listProspects(companyId));
	}

	@GET
	@Path("/prospects/{id}")
	public Response getProspect(@PathParam("id") Long id) {
		return okOrBadRequest(() -> service.getProspect(id));
	}

	@PUT
	@Path("/prospects/{id}")
	public Response updateProspect(@PathParam("id") Long id, Prospect request) {
		return okOrBadRequest(() -> service.updateProspect(id, request));
	}

	@GET
	@Path("/prospects/{id}/requirements")
	public Response listProspectRequirements(@PathParam("id") Long id) {
		return okOrBadRequest(() -> service.listRequirementsByProspect(id));
	}

	@GET
	@Path("/prospects/{id}/site-visits")
	public Response listProspectSiteVisits(@PathParam("id") Long id) {
		return okOrBadRequest(() -> service.listSiteVisitsByProspect(id));
	}

	@GET
	@Path("/prospects/{id}/offers")
	public Response listProspectOffers(@PathParam("id") Long id) {
		return okOrBadRequest(() -> service.listOffersByProspect(id));
	}

	@GET
	@Path("/prospects/{id}/reservations")
	public Response listProspectReservations(@PathParam("id") Long id) {
		return okOrBadRequest(() -> service.listReservationsByProspect(id));
	}

	@POST
	@Path("/requirements")
	public Response saveRequirement(Requirement request) {
		return created(() -> service.saveRequirement(request));
	}

	@PUT
	@Path("/requirements/{id}")
	public Response updateRequirement(@PathParam("id") Long id, Requirement request) {
		return okOrBadRequest(() -> service.updateRequirement(id, request));
	}

	@POST
	@Path("/units")
	public Response createUnit(Unit request) {
		return created(() -> service.createUnit(request));
	}

	@POST
	@Path("/units/search")
	public Response searchUnits(UnitSearch request) {
		return okOrBadRequest(() -> service.searchAvailableUnits(request));
	}

	@POST
	@Path("/site-visits")
	public Response createSiteVisit(SiteVisit request) {
		return created(() -> service.createSiteVisit(request));
	}

	@PUT
	@Path("/site-visits/{id}")
	public Response updateSiteVisit(@PathParam("id") Long id, SiteVisit request) {
		return okOrBadRequest(() -> service.updateSiteVisit(id, request));
	}

	@POST
	@Path("/offers")
	public Response createOffer(Offer request) {
		return created(() -> service.createOffer(request));
	}

	@PUT
	@Path("/offers/{id}")
	public Response updateOffer(@PathParam("id") Long id, Offer request) {
		return okOrBadRequest(() -> service.updateOffer(id, request));
	}

	@POST
	@Path("/offers/{id}/approval")
	public Response approveOffer(@PathParam("id") Long id, ApprovalRequest request) {
		return okOrBadRequest(() -> service.approveOffer(id, request));
	}

	@POST
	@Path("/offers/{id}/status")
	public Response updateOfferStatus(@PathParam("id") Long id, OfferStatusRequest request) {
		return okOrBadRequest(() -> service.updateOfferStatus(id, request));
	}

	@GET
	@Path("/offers")
	public Response listOffers(@QueryParam("companyId") Long companyId) {
		return ok(service.listOffers(companyId));
	}

	@POST
	@Path("/negotiations")
	public Response createNegotiation(Negotiation request) {
		return created(() -> service.createNegotiation(request));
	}

	@GET
	@Path("/reservations")
	public Response listReservations(@QueryParam("companyId") Long companyId) {
		return ok(service.listReservations(companyId));
	}

	@POST
	@Path("/reservations")
	public Response createReservation(Reservation request) {
		return created(() -> service.createReservationRequest(request));
	}

	@PUT
	@Path("/reservations/{id}")
	public Response updateReservation(@PathParam("id") Long id, Reservation request) {
		return okOrBadRequest(() -> service.updateReservation(id, request));
	}

	@POST
	@Path("/reservations/{id}/approval")
	public Response approveReservation(@PathParam("id") Long id, ApprovalRequest request) {
		return okOrBadRequest(() -> service.approveReservation(id, request));
	}

	@POST
	@Path("/reservations/{id}/status")
	public Response updateReservationStatus(@PathParam("id") Long id, ReservationStatusRequest request) {
		return okOrBadRequest(() -> service.updateReservationStatus(id, request));
	}

	@POST
	@Path("/reservations/{id}/payment")
	public Response recordPayment(@PathParam("id") Long id, PaymentReceipt request) {
		request.reservationId = id;
		return created(() -> service.recordPayment(request));
	}

	@POST
	@Path("/reservations/{id}/confirm")
	public Response confirmReservation(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> service.confirmReservation(id, updatedBy));
	}

	@POST
	@Path("/reservations/{id}/cancel")
	public Response cancelReservation(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> service.cancelReservation(id, updatedBy));
	}

	@POST
	@Path("/reservations/{id}/expire")
	public Response expireReservation(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> service.expireReservation(id, updatedBy));
	}

	@POST
	@Path("/reservations/{id}/move-to-lease")
	public Response moveToLease(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> service.moveToLease(id, updatedBy));
	}

	@GET
	@Path("/reports/summary")
	public Response reportSummary() {
		return ok(service.reportSummary());
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
		catch (Exception ex) {
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
		if (value instanceof Number number) {
			return number.longValue();
		}
		if (value instanceof String text && !text.isBlank()) {
			try {
				return Long.valueOf(text);
			}
			catch (NumberFormatException ex) {
				throw new IllegalArgumentException("Logged user id is invalid");
			}
		}
		return null;
	}

	@FunctionalInterface
	private interface Action {
		Object run();
	}
}
