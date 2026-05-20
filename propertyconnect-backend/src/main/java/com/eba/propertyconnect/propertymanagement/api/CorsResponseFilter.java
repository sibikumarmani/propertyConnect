package com.eba.propertyconnect.propertymanagement.api;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import com.eba.propertyconnect.propertymanagement.util.ApplicationConfig;

import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
public class CorsResponseFilter implements ContainerRequestFilter, ContainerResponseFilter {

	private static final Set<String> DEFAULT_ALLOWED_ORIGINS = Set.of(
			"http://localhost:3000",
			"http://127.0.0.1:3000");
	private static final String ALLOWED_HEADERS = "Content-Type,Authorization,X-Company-Id";
	private static final Set<String> ALLOWED_ORIGINS = allowedOrigins();

	@Override
	public void filter(ContainerRequestContext requestContext) throws IOException {
		if (!HttpMethod.OPTIONS.equalsIgnoreCase(requestContext.getMethod())) {
			return;
		}

		String origin = requestContext.getHeaderString("Origin");
		if (!isAllowedOrigin(origin)) {
			return;
		}

		requestContext.abortWith(applyCorsHeaders(Response.noContent(), origin).build());
	}

	@Override
	public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
			throws IOException {
		String origin = requestContext.getHeaderString("Origin");
		if (!isAllowedOrigin(origin)) {
			return;
		}

		responseContext.getHeaders().putSingle("Access-Control-Allow-Origin", origin);
		responseContext.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
		responseContext.getHeaders().putSingle("Vary", "Origin");
		responseContext.getHeaders().putSingle("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
		responseContext.getHeaders().putSingle("Access-Control-Allow-Headers", ALLOWED_HEADERS);
		responseContext.getHeaders().putSingle("Access-Control-Max-Age", "3600");
	}

	private Response.ResponseBuilder applyCorsHeaders(Response.ResponseBuilder response, String origin) {
		return response
				.header("Access-Control-Allow-Origin", origin)
				.header("Access-Control-Allow-Credentials", "true")
				.header("Vary", "Origin")
				.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
				.header("Access-Control-Allow-Headers", ALLOWED_HEADERS)
				.header("Access-Control-Max-Age", "3600");
	}

	private boolean isAllowedOrigin(String origin) {
		if (origin == null || origin.isBlank()) {
			return false;
		}
		if (ALLOWED_ORIGINS.contains(origin)) {
			return true;
		}
		return ApplicationConfig.propertyConnectCorsAllowLocalhost() && isLoopbackHttpOrigin(origin);
	}

	private boolean isLoopbackHttpOrigin(String origin) {
		try {
			URI uri = new URI(origin);
			String scheme = uri.getScheme();
			String host = uri.getHost();
			int port = uri.getPort();
			return ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
					&& ("localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host) || "::1".equals(host))
					&& port >= 1024
					&& port <= 65535;
		}
		catch (URISyntaxException ex) {
			return false;
		}
	}

	private static Set<String> allowedOrigins() {
		String configuredOrigins = ApplicationConfig.propertyConnectCorsAllowedOrigins();
		if (ApplicationConfig.isBlank(configuredOrigins)) {
			return DEFAULT_ALLOWED_ORIGINS;
		}
		Set<String> origins = Arrays.stream(configuredOrigins.split(","))
				.map(String::trim)
				.filter(origin -> !origin.isEmpty())
				.collect(Collectors.toUnmodifiableSet());
		return origins.isEmpty() ? DEFAULT_ALLOWED_ORIGINS : origins;
	}
}
