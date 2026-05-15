package com.eba.propertyconnect.propertymanagement.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/health")
@ApplicationScoped
public class HealthResource {

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response health() {
		return Response.ok(new HealthStatus("propertyConnect backend is running")).build();
	}

	public record HealthStatus(String message) {
	}
}
