# propertyConnect Backend

Java 17 / Jakarta EE 10 backend for the propertyConnect application.

Initial scope is login only. The backend acts as the REST facade between the Next.js frontend and coreConnect ERP SOAP authentication services; it should not modify anything in the `coreConnect` project.

## Build

```sh
mvn clean package
```

## Local Server

The bundled PropertyConnect TomEE server should run on port `8080`.

```text
http://localhost:8080/propertyConnect/api
```

## API

The application is exposed under `/api`.

```text
GET /api/health
POST /api/auth/login
POST /api/auth/company
GET /api/propertymanagement/crm-leasing/leads
POST /api/propertymanagement/crm-leasing/leads
POST /api/propertymanagement/crm-leasing/leads/{id}/qualify
POST /api/propertymanagement/crm-leasing/leads/{id}/convert-to-prospect
GET /api/propertymanagement/crm-leasing/prospects
POST /api/propertymanagement/crm-leasing/requirements
POST /api/propertymanagement/crm-leasing/units/search
POST /api/propertymanagement/crm-leasing/site-visits
GET /api/propertymanagement/crm-leasing/offers
POST /api/propertymanagement/crm-leasing/offers
POST /api/propertymanagement/crm-leasing/negotiations
GET /api/propertymanagement/crm-leasing/reservations
POST /api/propertymanagement/crm-leasing/reservations
POST /api/propertymanagement/crm-leasing/reservations/{id}/approval
POST /api/propertymanagement/crm-leasing/reservations/{id}/payment
POST /api/propertymanagement/crm-leasing/reservations/{id}/confirm
POST /api/propertymanagement/crm-leasing/reservations/{id}/move-to-lease
GET /api/propertymanagement/crm-leasing/reports/summary
```

## CRM Leasing Database

Apply the CRM Leasing sample DDL before using the Lead / Prospect to Reservation module:

```sh
mysql -u root propertyconnect_db < src/main/resources/db/migration/V001__crm_leasing.sql
```

## Login Integration

`POST /api/auth/login` does not validate passwords locally. It forwards the credentials to the ERP system SOAP API, then returns the token shape expected by the propertyConnect frontend.

Configure the CoreConnect SOAP target in `propertyconnect-backend/local.properties`:

```properties
coreconnect.soap.endpoint=http://localhost:8080/coreConnect/webservices
coreconnect.soap.namespace=http://ws.webservice.eba.com/
```

The backend builds service endpoints as:

```text
{coreconnect.soap.endpoint}/{webServiceName}
```

For example, login calls:

```text
http://localhost:8080/coreConnect/webservices/SecurityWebService
```

JVM system properties override `local.properties`. Environment variables are used as fallback using uppercase names with dots replaced by underscores, such as `CORECONNECT_SOAP_ENDPOINT`.

If the CoreConnect SOAP endpoint itself requires transport credentials, configure:

```properties
coreconnect.soap.username=service-user
coreconnect.soap.password=service-password
```

These are service credentials only. The end-user login ID and password still come from `POST /api/auth/login` and are sent inside the SOAP `search` payload.

SOAPAction is not sent by default. If the ERP requires a SOAPAction for a specific operation, use operation-specific settings:

```properties
coreconnect.soap.action.validateUserCredentials=...
coreconnect.soap.action.validateUserCompany=...
```

The backend mirrors the coreConnect `LoginUiBean` process:

1. `POST /api/auth/login` calls `SecurityWebService.validateUserCredentials`, which maps to CoreConnect portal login validation.
2. The backend loads company choices from `CommonWebService.getCompanyByUser` for regular users, or `CommonWebService.getCompany` for support/admin users.
3. `POST /api/auth/company` calls `SecurityWebService.validateUserCompany` after the user selects a company.

The login call sends this SOAP body:

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <validateUserCredentials>
      <search>
        <loginId>user login id</loginId>
        <impersonateLoginId>optional impersonated login id</impersonateLoginId>
        <code>password</code>
        <password>password</password>
        <superUserCode>optional super user password</superUserCode>
        <applicationId>propertyConnect</applicationId>
        <productId>propertyConnect</productId>
        <systemId>propertyConnect</systemId>
        <userInterface>P</userInterface>
      </search>
    </validateUserCredentials>
  </soapenv:Body>
</soapenv:Envelope>
```

If the login ID contains the coreConnect impersonation delimiter, `user|_ILID_|impersonatedUser`, the backend splits it and sends `impersonateLoginId` separately.

Optional settings:

```properties
propertyconnect.application.id=propertyConnect
propertyconnect.token.secret=change-this-secret
```

If you need impersonation, the frontend accepts login IDs formatted as:

```text
userLoginId|_ILID_|impersonatedLoginId
```

The backend will forward `impersonateLoginId` and `superUserCode` to the ERP SOAP login request.

## Package Standard

Backend code should use the project package:

```text
com.eba.propertyconnect.propertymanagement
```

ERP login integration code lives under:

```text
com.eba.propertyconnect.propertymanagement.integration.coreconnect
```

ERP-owned master data should remain in coreConnect. propertyConnect should store only property-management data and reference coreConnect records by ID where needed.
