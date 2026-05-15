package com.eba.propertyconnect.propertymanagement.api;

import java.io.IOException;
import java.util.Set;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
public class CorsResponseFilter implements ContainerResponseFilter {

	private static final Set<String> ALLOWED_ORIGINS = Set.of(
			"http://localhost:3000",
			"http://127.0.0.1:3000");

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
}
