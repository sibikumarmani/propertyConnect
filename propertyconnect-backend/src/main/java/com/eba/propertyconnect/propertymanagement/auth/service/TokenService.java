package com.eba.propertyconnect.propertymanagement.auth.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.eba.propertyconnect.propertymanagement.auth.domain.AuthenticatedUser;
import com.eba.propertyconnect.propertymanagement.util.ApplicationConfig;
import com.google.gson.Gson;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TokenService {

	private static final String BEARER_PREFIX = "Bearer ";
	private static final String HMAC_SHA256 = "HmacSHA256";
	private static final Gson GSON = new Gson();

	public String issueToken(AuthenticatedUser user, boolean rememberMe) {
		long expiresAt = Instant.now().plusSeconds(rememberMe ? 60L * 60L * 24L * 30L : 60L * 60L * 8L).getEpochSecond();
		TokenPayload payload = new TokenPayload(user.id(), user.name(), user.email(), expiresAt);
		String encodedPayload = base64Url(GSON.toJson(payload).getBytes(StandardCharsets.UTF_8));
		String signature = sign(encodedPayload);
		return encodedPayload + "." + signature;
	}

	public String authenticatedUserId(String authorizationHeader) {
		TokenPayload payload = tokenPayload(authorizationHeader);
		return payload == null ? null : payload.userId();
	}

	public AuthenticatedUser authenticatedUser(String authorizationHeader) {
		TokenPayload payload = tokenPayload(authorizationHeader);
		if (payload == null) {
			return null;
		}
		return new AuthenticatedUser(payload.userId(), payload.name(), payload.email());
	}

	private TokenPayload tokenPayload(String authorizationHeader) {
		if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
			return null;
		}
		String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
		String[] parts = token.split("\\.", 2);
		if (parts.length != 2 || !sign(parts[0]).equals(parts[1])) {
			return null;
		}
		try {
			String json = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
			TokenPayload payload = GSON.fromJson(json, TokenPayload.class);
			if (payload == null || payload.expiresAt() < Instant.now().getEpochSecond()) {
				return null;
			}
			return payload;
		}
		catch (IllegalArgumentException ex) {
			return null;
		}
	}

	private String sign(String encodedPayload) {
		try {
			Mac mac = Mac.getInstance(HMAC_SHA256);
			mac.init(new SecretKeySpec(tokenSecret().getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
			return base64Url(mac.doFinal(encodedPayload.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new IllegalStateException("Unable to issue authentication token.", ex);
		}
	}

	private String tokenSecret() {
		String configuredSecret = ApplicationConfig.propertyConnectTokenSecret();
		if (!ApplicationConfig.isBlank(configuredSecret)) {
			return configuredSecret;
		}
		return Base64.getEncoder().encodeToString("propertyConnect-local-token-secret".getBytes(StandardCharsets.UTF_8));
	}

	private String base64Url(byte[] value) {
		return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
	}

	private record TokenPayload(String userId, String name, String email, long expiresAt) {
	}
}
