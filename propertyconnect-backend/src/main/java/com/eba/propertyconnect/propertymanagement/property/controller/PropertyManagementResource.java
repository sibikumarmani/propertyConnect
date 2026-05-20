package com.eba.propertyconnect.propertymanagement.property.controller;

import java.time.LocalDate;

import org.apache.ibatis.exceptions.PersistenceException;

import com.eba.propertyconnect.propertymanagement.auth.service.TokenService;
import com.eba.propertyconnect.propertymanagement.property.domain.MasterRecord;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertyMaster;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertySearch;
import com.eba.propertyconnect.propertymanagement.property.domain.WorkflowRow;
import com.eba.propertyconnect.propertymanagement.property.service.MasterService;
import com.eba.propertyconnect.propertymanagement.property.service.PropertyService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
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

@Path("/propertymanagement/property-management")
@ApplicationScoped
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PropertyManagementResource {

	private static final String CORE_USER_ID = "userId";
	private static final Gson GSON = new GsonBuilder()
			.setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
			.registerTypeAdapter(LocalDate.class, (com.google.gson.JsonSerializer<LocalDate>) (value, type, context) -> context.serialize(value.toString()))
			.create();

	@Inject
	private MasterService masterService;

	@Inject
	private PropertyService propertyService;

	@Inject
	private TokenService tokenService;

	@Context
	private HttpServletRequest httpRequest;

	@GET
	@Path("/masters/{type}")
	public Response listMasters(@PathParam("type") String type, @QueryParam("companyId") Long companyId,
			@QueryParam("includeInactive") boolean includeInactive) {
		return okOrBadRequest(() -> masterService.list(type, companyId, includeInactive));
	}

	@POST
	@Path("/masters/{type}")
	public Response createMaster(@PathParam("type") String type, MasterRecord request) {
		return created(() -> {
			request.createdBy = loggedUserId(request.createdBy);
			return masterService.create(type, request);
		});
	}

	@PUT
	@Path("/masters/{type}/{id}")
	public Response updateMaster(@PathParam("type") String type, @PathParam("id") Long id, MasterRecord request) {
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return masterService.update(type, id, request);
		});
	}

	@DELETE
	@Path("/masters/{type}/{id}")
	public Response deactivateMaster(@PathParam("type") String type, @PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> {
			masterService.deactivate(type, id, loggedUserId(updatedBy));
			return new JsonObject();
		});
	}

	@GET
	@Path("/properties")
	public Response listProperties(@QueryParam("companyId") Long companyId, @QueryParam("search") String search, @QueryParam("region") String region,
			@QueryParam("propertyType") String propertyType, @QueryParam("onboardingStatus") String onboardingStatus,
			@QueryParam("includeInactive") Boolean includeInactive, @QueryParam("page") Integer page, @QueryParam("pageSize") Integer pageSize) {
		PropertySearch request = new PropertySearch();
		request.companyId = companyId;
		request.search = search;
		request.region = region;
		request.propertyType = propertyType;
		request.onboardingStatus = onboardingStatus;
		request.includeInactive = includeInactive;
		request.page = page;
		request.pageSize = pageSize;
		return okOrBadRequest(() -> propertyService.list(request));
	}

	@POST
	@Path("/properties")
	public Response createProperty(PropertyMaster request) {
		return created(() -> {
			request.createdBy = loggedUserId(request.createdBy);
			request.updatedBy = request.createdBy;
			return propertyService.create(request);
		});
	}

	@GET
	@Path("/properties/{id}")
	public Response getProperty(@PathParam("id") Long id) {
		return okOrBadRequest(() -> propertyService.get(id));
	}

	@PUT
	@Path("/properties/{id}/profile")
	public Response saveProfile(@PathParam("id") Long id, PropertyMaster request) {
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return propertyService.saveProfile(id, request);
		});
	}

	@PUT
	@Path("/properties/{id}/documents")
	public Response saveDocuments(@PathParam("id") Long id, PropertyMaster request) {
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return propertyService.saveDocuments(id, request);
		});
	}

	@PUT
	@Path("/properties/{id}/operating-model")
	public Response saveOperatingModel(@PathParam("id") Long id, PropertyMaster request) {
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return propertyService.saveOperatingModel(id, request);
		});
	}

	@GET
	@Path("/properties/{id}/blocks")
	public Response blocks(@PathParam("id") Long propertyId) {
		return okOrBadRequest(() -> propertyService.blocks(propertyId));
	}

	@POST
	@Path("/properties/{id}/blocks")
	public Response saveBlock(@PathParam("id") Long propertyId, MasterRecord request) {
		return created(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			request.createdBy = request.updatedBy;
			return propertyService.saveBlock(propertyId, request);
		});
	}

	@PUT
	@Path("/blocks/{id}")
	public Response updateBlock(@PathParam("id") Long id, MasterRecord request) {
		request.id = id;
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return propertyService.saveBlock(request.parentId, request);
		});
	}

	@DELETE
	@Path("/blocks/{id}")
	public Response deactivateBlock(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> {
			propertyService.deactivateBlock(id, loggedUserId(updatedBy));
			return new JsonObject();
		});
	}

	@GET
	@Path("/blocks/{id}/floors")
	public Response floors(@PathParam("id") Long blockId) {
		return okOrBadRequest(() -> propertyService.floors(blockId));
	}

	@POST
	@Path("/blocks/{id}/floors")
	public Response saveFloor(@PathParam("id") Long blockId, MasterRecord request) {
		return created(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			request.createdBy = request.updatedBy;
			return propertyService.saveFloor(blockId, request);
		});
	}

	@PUT
	@Path("/floors/{id}")
	public Response updateFloor(@PathParam("id") Long id, MasterRecord request) {
		request.id = id;
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return propertyService.saveFloor(request.parentId, request);
		});
	}

	@DELETE
	@Path("/floors/{id}")
	public Response deactivateFloor(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> {
			propertyService.deactivateFloor(id, loggedUserId(updatedBy));
			return new JsonObject();
		});
	}

	@GET
	@Path("/floors/{id}/units")
	public Response units(@PathParam("id") Long floorId) {
		return okOrBadRequest(() -> propertyService.units(floorId));
	}

	@POST
	@Path("/floors/{id}/units")
	public Response saveUnit(@PathParam("id") Long floorId, MasterRecord request) {
		return created(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			request.createdBy = request.updatedBy;
			return propertyService.saveUnit(floorId, request);
		});
	}

	@PUT
	@Path("/units/{id}")
	public Response updateUnit(@PathParam("id") Long id, MasterRecord request) {
		request.id = id;
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return propertyService.saveUnit(request.parentId, request);
		});
	}

	@DELETE
	@Path("/units/{id}")
	public Response deactivateUnit(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> {
			propertyService.deactivateUnit(id, loggedUserId(updatedBy));
			return new JsonObject();
		});
	}

	@GET
	@Path("/properties/{id}/amenities")
	public Response amenities(@PathParam("id") Long propertyId) {
		return okOrBadRequest(() -> propertyService.amenities(propertyId));
	}

	@POST
	@Path("/properties/{id}/amenities")
	public Response saveAmenity(@PathParam("id") Long propertyId, MasterRecord request) {
		return created(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			request.createdBy = request.updatedBy;
			return propertyService.saveAmenity(propertyId, request);
		});
	}

	@PUT
	@Path("/amenities/{id}")
	public Response updateAmenity(@PathParam("id") Long id, MasterRecord request) {
		request.id = id;
		return okOrBadRequest(() -> {
			request.updatedBy = loggedUserId(request.updatedBy);
			return propertyService.saveAmenity(request.parentId, request);
		});
	}

	@DELETE
	@Path("/amenities/{id}")
	public Response deactivateAmenity(@PathParam("id") Long id, @QueryParam("updatedBy") Long updatedBy) {
		return okOrBadRequest(() -> {
			propertyService.deactivateAmenity(id, loggedUserId(updatedBy));
			return new JsonObject();
		});
	}

	@GET
	@Path("/properties/{id}/workflow")
	public Response workflow(@PathParam("id") Long propertyId) {
		return okOrBadRequest(() -> propertyService.workflow(propertyId));
	}

	@POST
	@Path("/properties/{id}/workflow")
	public Response saveWorkflow(@PathParam("id") Long propertyId, WorkflowRow row) {
		return created(() -> {
			row.updatedBy = loggedUserId(row.updatedBy);
			return propertyService.saveWorkflow(propertyId, row);
		});
	}

	@GET
	@Path("/properties/{id}/tree")
	public Response tree(@PathParam("id") Long propertyId) {
		return okOrBadRequest(() -> propertyService.tree(propertyId));
	}

	@GET
	@Path("/properties/{id}/summary")
	public Response summary(@PathParam("id") Long propertyId) {
		return okOrBadRequest(() -> propertyService.summary(propertyId));
	}

	private Response okOrBadRequest(Action action) {
		return respond(action, Response.Status.OK);
	}

	private Response created(Action action) {
		return respond(action, Response.Status.CREATED);
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
		catch (PersistenceException ex) {
			return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(error(databaseErrorMessage(ex))).build();
		}
		catch (RuntimeException ex) {
			return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(error("Property management request failed. Please check the backend log.")).build();
		}
	}

	private String error(String message) {
		JsonObject error = new JsonObject();
		error.addProperty("message", message);
		return GSON.toJson(error);
	}

	private String databaseErrorMessage(Throwable ex) {
		Throwable current = ex;
		while (current != null) {
			String message = current.getMessage();
			if (message != null && message.toLowerCase().contains("access denied for user")) {
				return "PropertyConnect database connection failed. Check propertyconnect.db.username and propertyconnect.db.password.";
			}
			current = current.getCause();
		}
		return "PropertyConnect database request failed. Check the backend log and database configuration.";
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
		return requestUserId;
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
