package com.eba.propertyconnect.propertymanagement.integration.coreconnect.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.function.Supplier;

import com.eba.propertyconnect.propertymanagement.integration.coreconnect.client.CoreConnectAuthSoapClient;
import com.eba.propertyconnect.propertymanagement.leasing.domain.ErpCodeValue;
import com.eba.propertyconnect.propertymanagement.util.CacheHelper;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ErpCodeValueService {

	private static final String CACHE_SCOPE = "erpCodeValue";
	private static final String CODE_CACHE_KEY = "erpCode:all";
	private static final String APPLICATION_CATEGORY = "A";
	private static final String CLIENT_CATEGORY = "G";
	private static final String COMPANY_CATEGORY = "C";

	@Inject
	private CoreConnectAuthSoapClient erpClient;

	public List<ErpCodeValue> listCodeValues(String codeType, Long clientId, Long companyId) {
		requireText(codeType, "Code type is required");
		ErpCode code = getCode(codeType);
		String category = code.category();
		if (APPLICATION_CATEGORY.equals(category)) {
			return filterByCodeId(applicationCodeValues(), code);
		}
		if (CLIENT_CATEGORY.equals(category)) {
			requireId(clientId, "Client is required for client-level code values");
			return filterByCodeId(clientCodeValues(clientId), code);
		}
		if (COMPANY_CATEGORY.equals(category)) {
			requireId(companyId, "Company is required for company-level code values");
			return filterByCodeId(companyCodeValues(companyId), code);
		}
		throw new IllegalArgumentException("Unsupported ERP code category " + category);
	}

	private ErpCode getCode(String codeType) {
		String normalizedCodeType = codeType.trim();
		for (ErpCode code : codes()) {
			if (normalizedCodeType.equals(code.codeType())) {
				return code;
			}
		}
		throw new IllegalArgumentException("ERP code type not found");
	}

	private List<ErpCode> codes() {
		return getGlobalCache(CODE_CACHE_KEY, () -> {
			List<ErpCode> codes = new ArrayList<>();
			JsonArray values = erpClient.getCode();
			for (JsonElement value : values) {
				if (value != null && value.isJsonObject()) {
					codes.add(toErpCode(value.getAsJsonObject()));
				}
			}
			return codes;
		});
	}

	private List<ErpCodeValue> applicationCodeValues() {
		String cacheKey = CacheHelper.getCacheKey(CACHE_SCOPE, APPLICATION_CATEGORY);
		return getGlobalCache(cacheKey, () -> toErpCodeValues(erpClient.getCodeValue(), "application", null));
	}

	private List<ErpCodeValue> clientCodeValues(Long clientId) {
		String cacheKey = CacheHelper.getCacheKey(CACHE_SCOPE, CLIENT_CATEGORY + ":" + clientId);
		return getGlobalCache(cacheKey, () -> toErpCodeValues(erpClient.getClientCodeValue(clientId), "client", clientId));
	}

	private List<ErpCodeValue> companyCodeValues(Long companyId) {
		String cacheKey = CacheHelper.getCacheKey(CACHE_SCOPE, COMPANY_CATEGORY + ":" + companyId);
		return getCompanyCache(cacheKey, () -> toErpCodeValues(erpClient.getCompanyCodeValue(companyId), "company", companyId));
	}

	private List<ErpCodeValue> filterByCodeId(List<ErpCodeValue> codeValues, ErpCode code) {
		return codeValues.stream()
				.filter(codeValue -> code.id().equals(codeValue.codeId))
				.peek(codeValue -> {
					codeValue.codeType = code.codeType();
					codeValue.category = code.category();
				})
				.toList();
	}

	private ErpCode toErpCode(JsonObject source) {
		Long id = firstLong(source, "id", "codeId");
		String category = firstString(source, "category", "type");
		if (category != null) {
			category = category.trim().toUpperCase(Locale.ROOT);
		}
		return new ErpCode(
				id,
				firstString(source, "codeType"),
				firstString(source, "name"),
				category);
	}

	private List<ErpCodeValue> toErpCodeValues(JsonArray values, String level, Long ownerId) {
		List<ErpCodeValue> codeValues = new ArrayList<>();
		for (JsonElement value : values) {
			if (value != null && value.isJsonObject()) {
				codeValues.add(toErpCodeValue(value.getAsJsonObject(), level, ownerId));
			}
		}
		return codeValues;
	}

	private ErpCodeValue toErpCodeValue(JsonObject source, String level, Long ownerId) {
		ErpCodeValue codeValue = new ErpCodeValue();
		codeValue.id = firstLong(source, "id");
		codeValue.codeId = firstLong(source, "codeId");
		codeValue.codeType = firstString(source, "codeType");
		codeValue.clientId = firstLong(source, "clientId");
		codeValue.companyId = firstLong(source, "companyId");
		if ("client".equals(level) && codeValue.clientId == null) {
			codeValue.clientId = ownerId;
		}
		if ("company".equals(level) && codeValue.companyId == null) {
			codeValue.companyId = ownerId;
		}
		codeValue.externalId = firstString(source, "externalId");
		codeValue.value = firstString(source, "value");
		codeValue.sort = firstInteger(source, "sort");
		codeValue.level = level;
		return codeValue;
	}

	@SuppressWarnings("unchecked")
	private <T> T getGlobalCache(String key, Supplier<T> supplier) {
		Object cachedValue = CacheHelper.getGlobalCache(key);
		if (cachedValue != null) {
			return (T) cachedValue;
		}
		T value = supplier.get();
		CacheHelper.putGlobalCache(key, value);
		return value;
	}

	@SuppressWarnings("unchecked")
	private <T> T getCompanyCache(String key, Supplier<T> supplier) {
		Object cachedValue = CacheHelper.getCompanyCache(key);
		if (cachedValue != null) {
			return (T) cachedValue;
		}
		T value = supplier.get();
		CacheHelper.putCompanyCache(key, value);
		return value;
	}

	private void requireId(Long value, String message) {
		if (value == null || value <= 0) {
			throw new IllegalArgumentException(message);
		}
	}

	private void requireText(String value, String message) {
		if (value == null || value.trim().isEmpty()) {
			throw new IllegalArgumentException(message);
		}
	}

	private Long firstLong(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && !source.get(name).isJsonNull()) {
				try {
					String value = textValue(source.get(name));
					if (value != null && !value.isBlank()) {
						return Long.valueOf(value);
					}
				}
				catch (NumberFormatException ex) {
					continue;
				}
			}
		}
		return null;
	}

	private Integer firstInteger(JsonObject source, String... names) {
		Long value = firstLong(source, names);
		return value == null ? null : value.intValue();
	}

	private String firstString(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && !source.get(name).isJsonNull()) {
				String value = textValue(source.get(name));
				if (value != null && !value.isBlank()) {
					return value;
				}
			}
		}
		return null;
	}

	private String textValue(JsonElement value) {
		if (value == null || value.isJsonNull()) {
			return null;
		}
		if (value.isJsonPrimitive()) {
			return value.getAsString();
		}
		if (value.isJsonObject()) {
			return firstString(value.getAsJsonObject(), "name", "value", "code", "description", "label", "text");
		}
		return null;
	}

	private record ErpCode(Long id, String codeType, String name, String category) {
	}
}
