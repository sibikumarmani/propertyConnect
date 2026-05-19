package com.eba.propertyconnect.propertymanagement.util;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public final class ApplicationConfig {

	private static final String SYSTEM_PROPERTIES_FILE = "system.properties";
	private static final String CORECONNECT_SOAP_ENDPOINT_PROPERTY = "coreconnect.soap.endpoint";
	private static final String CORECONNECT_SOAP_USERNAME_PROPERTY = "coreconnect.soap.username";
	private static final String CORECONNECT_SOAP_PASSWORD_PROPERTY = "coreconnect.soap.password";
	private static final String CORECONNECT_SOAP_NAMESPACE_PROPERTY = "coreconnect.soap.namespace";
	private static final String CORECONNECT_SOAP_ACTION_PROPERTY_PREFIX = "coreconnect.soap.action.";
	private static final String PROPERTYCONNECT_APPLICATION_ID_PROPERTY = "propertyconnect.application.id";
	private static final String PROPERTYCONNECT_TOKEN_SECRET_PROPERTY = "propertyconnect.token.secret";
	private static final String PROPERTYCONNECT_DB_JDBC_URL_PROPERTY = "propertyconnect.db.jdbcUrl";
	private static final String PROPERTYCONNECT_DB_USERNAME_PROPERTY = "propertyconnect.db.username";
	private static final String PROPERTYCONNECT_DB_PASSWORD_PROPERTY = "propertyconnect.db.password";
	private static final String PROPERTYCONNECT_DB_MAX_POOL_SIZE_PROPERTY = "propertyconnect.db.maxPoolSize";
	private static final Properties SYSTEM_PROPERTIES = loadSystemProperties();

	private ApplicationConfig() {
	}

	public static String coreConnectSoapEndpointUrl() {
		return getConfigValue(CORECONNECT_SOAP_ENDPOINT_PROPERTY);
	}

	public static String coreConnectSoapEndpointUrl(String webServiceName) {
		String endpointUrl = coreConnectSoapEndpointUrl();
		if (isBlank(endpointUrl) || isBlank(webServiceName)) {
			return endpointUrl;
		}
		String baseUrl = endpointUrl.trim();
		String servicePath = webServiceName.trim();
		while (baseUrl.endsWith("/")) {
			baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
		}
		while (servicePath.startsWith("/")) {
			servicePath = servicePath.substring(1);
		}
		return baseUrl + "/" + servicePath;
	}

	public static String coreConnectSoapNamespace() {
		String namespace = getConfigValue(CORECONNECT_SOAP_NAMESPACE_PROPERTY);
		return isBlank(namespace) ? "http://coreconnect.eba.com/" : namespace;
	}

	public static String coreConnectSoapUsername() {
		return getConfigValue(CORECONNECT_SOAP_USERNAME_PROPERTY);
	}

	public static String coreConnectSoapPassword() {
		return getConfigValue(CORECONNECT_SOAP_PASSWORD_PROPERTY);
	}

	public static String coreConnectSoapAction(String operation) {
		return isBlank(operation) ? "" : getConfigValue(CORECONNECT_SOAP_ACTION_PROPERTY_PREFIX + operation);
	}

	public static String propertyConnectApplicationId() {
		String applicationId = getConfigValue(PROPERTYCONNECT_APPLICATION_ID_PROPERTY);
		return isBlank(applicationId) ? "iCoreESSP" : applicationId;
	}

	public static String propertyConnectTokenSecret() {
		return getConfigValue(PROPERTYCONNECT_TOKEN_SECRET_PROPERTY);
	}

	public static String propertyConnectDbJdbcUrl() {
		return getConfigValue(PROPERTYCONNECT_DB_JDBC_URL_PROPERTY);
	}

	public static String propertyConnectDbUsername() {
		return getConfigValue(PROPERTYCONNECT_DB_USERNAME_PROPERTY);
	}

	public static String propertyConnectDbPassword() {
		return getConfigValue(PROPERTYCONNECT_DB_PASSWORD_PROPERTY);
	}

	public static int propertyConnectDbMaxPoolSize() {
		String value = getConfigValue(PROPERTYCONNECT_DB_MAX_POOL_SIZE_PROPERTY);
		if (isBlank(value)) {
			return 10;
		}
		try {
			return Integer.parseInt(value);
		}
		catch (NumberFormatException ex) {
			return 10;
		}
	}

	private static String getConfigValue(String propertyName) {
		String systemPropertyValue = SYSTEM_PROPERTIES.getProperty(propertyName);
		if (!isBlank(systemPropertyValue)) {
			return systemPropertyValue.trim();
		}
		return null;
	}

	private static Properties loadSystemProperties() {
		Properties properties = new Properties();
		try (InputStream inputStream = ApplicationConfig.class.getClassLoader().getResourceAsStream(SYSTEM_PROPERTIES_FILE)) {
			if (inputStream != null) {
				properties.load(inputStream);
			}
		}
		catch (IOException ex) {
			throw new IllegalStateException("Unable to load PropertyConnect properties from " + SYSTEM_PROPERTIES_FILE, ex);
		}
		return properties;
	}

	public static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
