package com.eba.propertyconnect.propertymanagement.integration.coreconnect.client;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Iterator;

import com.eba.propertyconnect.propertymanagement.auth.domain.LoginRequest;
import com.eba.propertyconnect.propertymanagement.exception.AuthenticationException;
import com.eba.propertyconnect.propertymanagement.util.ApplicationConfig;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.sun.xml.fastinfoset.dom.DOMDocumentParser;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.dom.DOMSource;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.xml.soap.Detail;
import jakarta.xml.soap.MimeHeaders;
import jakarta.xml.soap.MessageFactory;
import jakarta.xml.soap.SOAPBody;
import jakarta.xml.soap.SOAPElement;
import jakarta.xml.soap.SOAPException;
import jakarta.xml.soap.SOAPFault;
import jakarta.xml.soap.SOAPMessage;
import org.jvnet.fastinfoset.FastInfosetException;
import org.w3c.dom.Document;

@ApplicationScoped
public class CoreConnectAuthSoapClient {

	private static final String COMMON_WEB_SERVICE = "CommonWebService";
	private static final String SECURITY_WEB_SERVICE = "SecurityWebService";
	private static final String VALIDATE_USER_CREDENTIALS = "validateUserCredentials";
	private static final String VALIDATE_USER_COMPANY = "validateUserCompany";
	private static final String GET_COMPANY = "getCompany";
	private static final String GET_COMPANY_BY_USER = "getCompanyByUser";
	private static final String PARAM_SEARCH = "search";
	private static final String PARAM_USER_PROFILE = "userProfile";
	private static final String PROPERTYCONNECT_SYSTEM_ID = "propertyConnect";
	private static final String USER_INTERFACE_PORTAL = "P";
	private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(15);
	private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
			.connectTimeout(REQUEST_TIMEOUT)
			.build();

	public JsonObject validateUserCredentials(LoginRequest request) {
		JsonObject search = new JsonObject();
		search.addProperty("loginId", request.getLoginId());
		search.addProperty("impersonateLoginId", request.getImpersonateLoginId());
		search.addProperty("code", request.getPassword());
		search.addProperty("password", request.getPassword());
		search.addProperty("superUserCode", request.getSuperUserPassword());
		search.addProperty("applicationId", ApplicationConfig.propertyConnectApplicationId());
		search.addProperty("productId", ApplicationConfig.propertyConnectApplicationId());
		search.addProperty("systemId", PROPERTYCONNECT_SYSTEM_ID);
		search.addProperty("userInterface", USER_INTERFACE_PORTAL);
		return callErpOperation(
				SECURITY_WEB_SERVICE,
				VALIDATE_USER_CREDENTIALS,
				soapParameter(PARAM_SEARCH, search));
	}

	public JsonArray getCompanyByUser(JsonObject userProfile) {
		JsonObject loggedUserProfile = effectiveUserProfile(userProfile);
		JsonObject search = new JsonObject();
		addProperty(search, "clientId", firstInteger(loggedUserProfile, "clientId"));
		String operation = isSupportUser(loggedUserProfile) ? GET_COMPANY : GET_COMPANY_BY_USER;
		if (GET_COMPANY_BY_USER.equals(operation)) {
			addProperty(search, "userId", firstInteger(loggedUserProfile, "id", "userId"));
		}
		JsonElement result = callErpOperationResult(COMMON_WEB_SERVICE, operation, soapParameter(PARAM_SEARCH, search));
		return toJsonArray(result, "company", "companies");
	}

	public JsonObject validateUserCompany(JsonObject userProfile, JsonObject search) {
		return callErpOperation(
				SECURITY_WEB_SERVICE,
				VALIDATE_USER_COMPANY,
				soapParameter(PARAM_USER_PROFILE, userProfile),
				soapParameter(PARAM_SEARCH, search));
	}

	private record SoapParameter(String elementName, JsonObject value) {
	}

	private SoapParameter soapParameter(String elementName, JsonObject value) {
		return new SoapParameter(elementName, value);
	}

	private JsonObject callErpOperation(String webServiceName, String operation, SoapParameter... parameters) {
		JsonElement result = callErpOperationResult(webServiceName, operation, parameters);
		if (result != null && result.isJsonObject()) {
			return result.getAsJsonObject();
		}
		JsonObject wrapper = new JsonObject();
		wrapper.add(operation + "Result", result == null ? new JsonObject() : result);
		return wrapper;
	}

	private JsonElement callErpOperationResult(String webServiceName, String operation, SoapParameter... parameters) {
		String endpointUrl = ApplicationConfig.coreConnectSoapEndpointUrl(webServiceName);
		if (ApplicationConfig.isBlank(endpointUrl)) {
			throw new AuthenticationException("CoreConnect SOAP endpoint is not configured.");
		}
		if (ApplicationConfig.isBlank(webServiceName) || ApplicationConfig.isBlank(operation)) {
			throw new AuthenticationException("CoreConnect SOAP web service and method are required.");
		}

		try {
			SOAPMessage soapRequest = createSoapRequest(operation, parameters);
			SOAPMessage soapResponse = sendSoapRequest(endpointUrl, operation, soapRequest);
			return readSoapResponse(operation, soapResponse);
		}
		catch (IOException | InterruptedException ex) {
			if (ex instanceof InterruptedException) {
				Thread.currentThread().interrupt();
			}
			throw new AuthenticationException("Unable to reach CoreConnect SOAP service.", ex);
		}
		catch (SOAPException ex) {
			throw new AuthenticationException("Invalid ERP SOAP response.", ex);
		}
	}

	private SOAPMessage createSoapRequest(String operation, SoapParameter... parameters) throws SOAPException {
		MessageFactory factory = MessageFactory.newInstance();
		SOAPMessage soapMessage = factory.createMessage();

		SOAPBody body = soapMessage.getSOAPPart().getEnvelope().getBody();
		SOAPElement operationElement = body.addChildElement(operation, "core", ApplicationConfig.coreConnectSoapNamespace());
		for (SoapParameter parameter : parameters) {
			if (parameter == null || ApplicationConfig.isBlank(parameter.elementName()) || parameter.value() == null) {
				continue;
			}
			addJsonElement(operationElement, parameter.elementName(), parameter.value());
		}

		soapMessage.saveChanges();
		return soapMessage;
	}

	private void addJsonElement(SOAPElement parent, String name, JsonObject object) throws SOAPException {
		SOAPElement element = parent.addChildElement(name);
		if (object == null) {
			return;
		}
		for (String key : object.keySet()) {
			JsonElement value = object.get(key);
			if (value == null || value.isJsonNull()) {
				continue;
			}
			if (value.isJsonObject()) {
				addJsonElement(element, key, value.getAsJsonObject());
			}
			else if (value.isJsonArray()) {
				addJsonArrayElements(element, key, value.getAsJsonArray());
			}
			else {
				addBodyElement(element, key, value.getAsString());
			}
		}
	}

	private void addJsonArrayElements(SOAPElement parent, String key, JsonArray array) throws SOAPException {
		for (JsonElement item : array) {
			if (item == null || item.isJsonNull()) {
				continue;
			}
			if (item.isJsonObject()) {
				addJsonElement(parent, key, item.getAsJsonObject());
			}
			else {
				addBodyElement(parent, key, item.getAsString());
			}
		}
	}

	private void addBodyElement(SOAPElement parent, String name, String value) throws SOAPException {
		SOAPElement element = parent.addChildElement(name);
		element.addTextNode(value == null ? "" : value);
	}

	private SOAPMessage sendSoapRequest(String endpointUrl, String operation, SOAPMessage soapRequest)
			throws IOException, InterruptedException, SOAPException {
		ByteArrayOutputStream requestBody = new ByteArrayOutputStream();
		soapRequest.writeTo(requestBody);

		HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(URI.create(endpointUrl))
				.timeout(REQUEST_TIMEOUT)
				.header("Content-Type", "text/xml; charset=UTF-8")
				.header("Accept", "text/xml, application/soap+xml, application/fastinfoset")
				.POST(HttpRequest.BodyPublishers.ofByteArray(requestBody.toByteArray()));
		String soapAction = ApplicationConfig.coreConnectSoapAction(operation);
		if (!ApplicationConfig.isBlank(soapAction)) {
			requestBuilder.header("SOAPAction", '"' + soapAction + '"');
		}
		addBasicAuthHeader(requestBuilder);

		HttpResponse<byte[]> response = HTTP_CLIENT.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofByteArray());
		return createSoapResponse(response);
	}

	private void addBasicAuthHeader(HttpRequest.Builder requestBuilder) {
		String username = ApplicationConfig.coreConnectSoapUsername();
		String password = ApplicationConfig.coreConnectSoapPassword();
		if (ApplicationConfig.isBlank(username)) {
			return;
		}
		String credentials = username + ":" + (password == null ? "" : password);
		String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
		requestBuilder.header("Authorization", "Basic " + encodedCredentials);
	}

	private SOAPMessage createSoapResponse(HttpResponse<byte[]> response) throws SOAPException, IOException {
		byte[] responseBody = response.body();
		String contentType = response.headers().firstValue("Content-Type").orElse("");
		if (isFastInfoset(contentType, responseBody)) {
			return createFastInfosetSoapResponse(responseBody);
		}

		MimeHeaders headers = new MimeHeaders();
		headers.addHeader("Content-Type", contentType.isBlank() ? "text/xml; charset=UTF-8" : contentType);
		return MessageFactory.newInstance().createMessage(headers, new ByteArrayInputStream(responseBody));
	}

	private boolean isFastInfoset(String contentType, byte[] responseBody) {
		return contentType.toLowerCase().contains("application/fastinfoset")
				|| (responseBody.length > 0 && (responseBody[0] & 0xff) == 0xe0);
	}

	private SOAPMessage createFastInfosetSoapResponse(byte[] responseBody) throws SOAPException {
		try {
			DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();
			documentBuilderFactory.setNamespaceAware(true);
			Document document = documentBuilderFactory.newDocumentBuilder().newDocument();
			new DOMDocumentParser().parse(document, new ByteArrayInputStream(responseBody));

			SOAPMessage soapMessage = MessageFactory.newInstance().createMessage();
			soapMessage.getSOAPPart().setContent(new DOMSource(document));
			soapMessage.saveChanges();
			return soapMessage;
		}
		catch (FastInfosetException | IOException ex) {
			throw new SOAPException("Unable to decode FastInfoset SOAP response.", ex);
		}
		catch (Exception ex) {
			throw new SOAPException("Unable to parse ERP SOAP response.", ex);
		}
	}

	private JsonElement readSoapResponse(String operation, SOAPMessage soapResponse) throws SOAPException {
		SOAPBody body = soapResponse.getSOAPBody();
		if (body == null) {
			throw new AuthenticationException("ERP login response contained no SOAP body.");
		}
		if (body.hasFault()) {
			SOAPFault fault = body.getFault();
			throw new AuthenticationException(soapFaultMessage(fault));
		}

		SOAPElement responseElement = firstSoapElement(body);
		if (responseElement == null) {
			throw new AuthenticationException("ERP login response was not understood.");
		}

		JsonElement result = unwrapSoapResult(operation, responseElement);
		if (result.isJsonObject()) {
			return result.getAsJsonObject();
		}
		return result;
	}

	private String soapFaultMessage(SOAPFault fault) {
		String message = fault.getFaultString();
		Detail detail = fault.getDetail();
		if (detail != null && detail.getTextContent() != null && !detail.getTextContent().isBlank()) {
			message = detail.getTextContent();
		}
		return ApplicationConfig.isBlank(message) ? "ERP login service rejected the request." : message;
	}

	private JsonElement unwrapSoapResult(String operation, SOAPElement responseElement) {
		JsonElement response = convertSoapElement(responseElement);
		if (!response.isJsonObject()) {
			return response;
		}
		JsonObject responseObject = response.getAsJsonObject();
		for (String resultName : new String[] { "return", "result", operation + "Return" }) {
			if (responseObject.has(resultName)) {
				return responseObject.get(resultName);
			}
		}
		return responseObject;
	}

	private boolean isSupportUser(JsonObject userProfile) {
		String userCategory = firstString(userProfile, "userCategory");
		return "A".equalsIgnoreCase(userCategory) || "P".equalsIgnoreCase(userCategory);
	}

	private JsonObject effectiveUserProfile(JsonObject source) {
		JsonObject nestedProfile = firstObject(source, "userProfile", "loggedUserProfile", "loggedUser", "user");
		return nestedProfile == null ? source : nestedProfile;
	}

	private JsonArray toJsonArray(JsonElement result, String... wrapperNames) {
		JsonArray values = new JsonArray();
		if (result == null || result.isJsonNull()) {
			return values;
		}
		if (result.isJsonArray()) {
			return result.getAsJsonArray();
		}
		if (!result.isJsonObject()) {
			return values;
		}

		JsonObject resultObject = result.getAsJsonObject();
		for (String wrapperName : wrapperNames) {
			if (!resultObject.has(wrapperName)) {
				continue;
			}
			JsonElement wrapped = resultObject.get(wrapperName);
			if (wrapped.isJsonArray()) {
				return wrapped.getAsJsonArray();
			}
			if (wrapped.isJsonObject()) {
				values.add(wrapped.getAsJsonObject());
				return values;
			}
		}
		values.add(resultObject);
		return values;
	}

	private void addProperty(JsonObject object, String name, Number value) {
		if (value != null) {
			object.addProperty(name, value);
		}
	}

	private Integer firstInteger(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && !source.get(name).isJsonNull()) {
				try {
					return Integer.valueOf(source.get(name).getAsString());
				}
				catch (NumberFormatException ex) {
					return null;
				}
			}
		}
		return null;
	}

	private JsonObject firstObject(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && source.get(name).isJsonObject()) {
				return source.getAsJsonObject(name);
			}
		}
		return null;
	}

	private String firstString(JsonObject source, String... names) {
		if (source == null) {
			return null;
		}
		for (String name : names) {
			if (source.has(name) && !source.get(name).isJsonNull()) {
				return source.get(name).getAsString();
			}
		}
		return null;
	}

	private SOAPElement firstSoapElement(SOAPBody body) {
		Iterator<?> bodyChildren = body.getChildElements();
		while (bodyChildren.hasNext()) {
			Object child = bodyChildren.next();
			if (child instanceof SOAPElement element) {
				return element;
			}
		}
		return null;
	}

	private JsonElement convertSoapElement(SOAPElement element) {
		Iterator<?> children = element.getChildElements();
		JsonObject object = new JsonObject();
		boolean hasChildElements = false;
		while (children.hasNext()) {
			Object child = children.next();
			if (child instanceof SOAPElement childElement) {
				hasChildElements = true;
				String key = childElement.getLocalName();
				JsonElement value = convertSoapElement(childElement);
				if (object.has(key)) {
					JsonElement existing = object.get(key);
					if (existing.isJsonArray()) {
						existing.getAsJsonArray().add(value);
					}
					else {
						JsonArray array = new JsonArray();
						array.add(existing);
						array.add(value);
						object.add(key, array);
					}
				}
				else {
					object.add(key, value);
				}
			}
		}
		if (!hasChildElements) {
			String value = element.getValue();
			return value == null ? new JsonObject() : new JsonPrimitive(value);
		}
		return object;
	}

}
