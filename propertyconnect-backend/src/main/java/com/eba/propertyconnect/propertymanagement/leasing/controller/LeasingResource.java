package com.eba.propertyconnect.propertymanagement.leasing.controller;

import java.time.LocalDate;

import com.eba.propertyconnect.propertymanagement.leasing.domain.ApprovalRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Lead;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Negotiation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Offer;
import com.eba.propertyconnect.propertymanagement.leasing.domain.PaymentReceipt;
import com.eba.propertyconnect.propertymanagement.leasing.domain.QualificationRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Requirement;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Reservation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.SiteVisit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Unit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.UnitSearch;
import com.eba.propertyconnect.propertymanagement.leasing.service.LeasingService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/propertymanagement/crm-leasing")
@ApplicationScoped
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LeasingResource {

	private static final Gson GSON = new GsonBuilder()
			.setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
			.registerTypeAdapter(LocalDate.class, (com.google.gson.JsonSerializer<LocalDate>) (value, type, context) -> context.serialize(value.toString()))
			.create();

	@Inject
	private LeasingService service;

	@GET
	@Path("/leads")
	public Response listLeads() {
		return ok(service.listLeads());
	}

	@POST
	@Path("/leads")
	public Response createLead(Lead request) {
		return created(() -> service.createLead(request));
	}

	@POST
	@Path("/leads/{id}/qualify")
	public Response qualifyLead(@PathParam("id") Long id, QualificationRequest request) {
		return okOrBadRequest(() -> service.qualifyLead(id, request));
	}

	@POST
	@Path("/leads/{id}/convert-to-prospect")
	public Response convertLead(@PathParam("id") Long id, @QueryParam("createdBy") Long createdBy) {
		return okOrBadRequest(() -> service.convertLeadToProspect(id, createdBy));
	}

	@GET
	@Path("/prospects")
	public Response listProspects() {
		return ok(service.listProspects());
	}

	@GET
	@Path("/prospects/{id}")
	public Response getProspect(@PathParam("id") Long id) {
		return okOrBadRequest(() -> service.getProspect(id));
	}

	@POST
	@Path("/requirements")
	public Response saveRequirement(Requirement request) {
		return created(() -> service.saveRequirement(request));
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

	@POST
	@Path("/offers")
	public Response createOffer(Offer request) {
		return created(() -> service.createOffer(request));
	}

	@GET
	@Path("/offers")
	public Response listOffers() {
		return ok(service.listOffers());
	}

	@POST
	@Path("/negotiations")
	public Response createNegotiation(Negotiation request) {
		return created(() -> service.createNegotiation(request));
	}

	@GET
	@Path("/reservations")
	public Response listReservations() {
		return ok(service.listReservations());
	}

	@POST
	@Path("/reservations")
	public Response createReservation(Reservation request) {
		return created(() -> service.createReservationRequest(request));
	}

	@POST
	@Path("/reservations/{id}/approval")
	public Response approveReservation(@PathParam("id") Long id, ApprovalRequest request) {
		return okOrBadRequest(() -> service.approveReservation(id, request));
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
	}

	private String error(String message) {
		JsonObject error = new JsonObject();
		error.addProperty("message", message);
		return GSON.toJson(error);
	}

	@FunctionalInterface
	private interface Action {
		Object run();
	}
}
