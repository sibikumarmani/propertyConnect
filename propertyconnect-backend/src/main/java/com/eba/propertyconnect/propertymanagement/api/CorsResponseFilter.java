package com.eba.propertyconnect.propertymanagement.api;

import java.io.IOException;
import java.util.Set;

import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
public class CorsResponseFilter implements ContainerRequestFilter, ContainerResponseFilter {

	private static final Set<String> ALLOWED_ORIGINS = Set.of(
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3001");

	@Override
	public void filter(ContainerRequestContext requestContext) throws IOException {
		if (!HttpMethod.OPTIONS.equalsIgnoreCase(requestContext.getMethod())) {
			return;
		}

		String origin = requestContext.getHeaderString("Origin");
		if (origin == null || !ALLOWED_ORIGINS.contains(origin)) {
			return;
		}

		requestContext.abortWith(applyCorsHeaders(Response.noContent(), origin).build());
	}

	@Override
	public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
			throws IOException {
		String origin = requestContext.getHeaderString("Origin");
		if (origin == null || !ALLOWED_ORIGINS.contains(origin)) {
			return;
		}

		responseContext.getHeaders().putSingle("Access-Control-Allow-Origin", origin);
		responseContext.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
		responseContext.getHeaders().putSingle("Vary", "Origin");
		responseContext.getHeaders().putSingle("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
		responseContext.getHeaders().putSingle("Access-Control-Allow-Headers", "Content-Type,Authorization");
		responseContext.getHeaders().putSingle("Access-Control-Max-Age", "3600");
	}

	private Response.ResponseBuilder applyCorsHeaders(Response.ResponseBuilder response, String origin) {
		return response
				.header("Access-Control-Allow-Origin", origin)
				.header("Access-Control-Allow-Credentials", "true")
				.header("Vary", "Origin")
				.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
				.header("Access-Control-Allow-Headers", "Content-Type,Authorization")
				.header("Access-Control-Max-Age", "3600");
	}
}
