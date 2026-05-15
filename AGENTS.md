# PropertyConnect Tech Stack

## 1. Project Overview

| Area | Value |
|---|---|
| Application Name | `propertyConnect` |
| Backend Module Name | `propertymanagement` |
| Main Package | `com.eba.propertyconnect.propertymanagement` |
| ERP System | `coreConnect ERP` |
| ERP Integration Method | SOAP Web Service |
| Backend Platform | Jakarta EE 10 |
| Java Version | Java 17 |
| Database | MySQL |
| Table Prefix | `pa_` |
| Frontend | Next.js / React.js |
| API Between Frontend and Backend | REST JSON API |
| API Between PropertyConnect and CoreConnect ERP | SOAP using Apache CXF |

---

# 2. Recommended Architecture

```text
Next.js / React Frontend
        |
        | REST API / JSON
        v
PropertyConnect Backend
Jakarta EE 10 + Java 17
        |
        | SOAP Client using Apache CXF
        v
CoreConnect ERP
Jakarta EE 10 + JSF + PrimeFaces + MyBatis
        |
        v
ERP Finance / Customer / Invoice / Receipt / GL
```

## Key Rule

The frontend should not call ERP SOAP services directly.

All ERP communication should happen through the PropertyConnect backend.

```text
Correct Flow:
Frontend -> PropertyConnect Backend -> ERP SOAP Service

Wrong Flow:
Frontend -> ERP SOAP Service
```

## Initial Implementation Scope

Start PropertyConnect with login/authentication only:

- Frontend login page posts credentials to the PropertyConnect backend.
- PropertyConnect backend validates credentials through coreConnect ERP SOAP services.
- Company selection is validated through the backend after login.
- Do not implement property, unit, lease, rent, invoice, receipt, maintenance, reporting, or scheduler services until the login integration is stable.
- Do not change any code, database scripts, screens, or configuration inside `coreConnect` for the initial PropertyConnect login work.

---

# 3. Frontend Tech Stack

## 3.1 Recommended Frontend

| Technology | Purpose |
|---|---|
| Next.js | Main frontend framework |
| React.js | UI library used by Next.js |
| TypeScript | Type-safe frontend development |
| PrimeReact | Enterprise UI components similar to PrimeFaces |
| Tailwind CSS | Layout and custom styling |
| React Hook Form | Form handling |
| Zod | Frontend validation schema |
| TanStack Query | API state management and caching |
| Axios | REST API communication |
| NextAuth / Custom JWT Handling | Authentication handling |

## 3.2 Why Next.js

Next.js is recommended instead of plain React.js because the Property Management system will require:

- Login page
- Company selection after login
- Protected routes
- Property dashboard
- Lease management screens
- Tenant management screens
- Rent invoice screens
- Maintenance request screens
- Report screens
- Approval workflow screens
- Better folder-based routing
- Better production deployment structure

## 3.3 UI Component Recommendation

Since the existing ERP uses PrimeFaces, the easiest migration path is:

```text
PrimeFaces -> PrimeReact
```

Recommended UI stack:

```text
Next.js + TypeScript + PrimeReact + Tailwind CSS
```

PrimeReact is suitable for ERP-style screens because it provides:

- DataTable
- Dialog
- Dropdown
- Calendar
- TreeTable
- TabView
- Menu
- FileUpload
- Toast
- ConfirmDialog

---

# 4. Backend Tech Stack

## 4.1 Recommended Backend

| Technology | Version / Recommendation | Purpose |
|---|---|---|
| Java | 17 | Main backend language |
| Jakarta EE API | 10 | Enterprise Java platform |
| CDI | Jakarta CDI | Dependency injection |
| JAX-RS | Jakarta RESTful Web Services | REST API for frontend |
| JAX-WS | Jakarta XML Web Services | SOAP service/client support |
| Bean Validation | Jakarta Validation / Hibernate Validator | Request and entity validation |
| MyBatis | 3.5.x | SQL mapper framework |
| MySQL Connector/J | 9.x | MySQL JDBC driver |
| HikariCP | 6.x | JDBC connection pooling |
| Apache CXF | 4.1.x | SOAP client integration with ERP |
| Jackson or Gson | Latest stable | JSON serialization/deserialization |
| JasperReports | 7.x | Report generation |
| Quartz Scheduler | 2.5.x | Scheduled jobs |
| ActiveMQ Client | 6.x | Messaging, if async process is required |
| Log4j / SLF4J | Stable version | Logging |
| Maven | Latest stable | Build management |

## 4.2 Backend Platform Decision

The backend should be built using:

```text
Jakarta EE 10 + Java 17 + MyBatis + MySQL + Apache CXF
```

This matches the existing CoreConnect ERP technology style and allows easy SOAP integration.

---

# 5. REST API Layer

The PropertyConnect backend should expose REST APIs to the Next.js frontend.

Example:

```text
GET    /api/properties
POST   /api/properties
GET    /api/properties/{id}
PUT    /api/properties/{id}
DELETE /api/properties/{id}

GET    /api/units
POST   /api/units

GET    /api/tenants
POST   /api/tenants

GET    /api/leases
POST   /api/leases
POST   /api/leases/{id}/approve
POST   /api/leases/{id}/activate

POST   /api/rent/generate
POST   /api/invoices/create-erp-invoice
POST   /api/receipts/sync-from-erp
```

## REST API Design Rule

REST API should use DTO classes.

Do not expose database entity or MyBatis model directly to frontend.

Recommended flow:

```text
Controller / Resource
        |
        v
Service
        |
        v
Mapper / Repository
        |
        v
Database
```

---

# 6. SOAP Integration With CoreConnect ERP

## 6.1 SOAP Client Technology

Use Apache CXF for SOAP client generation and communication.

Recommended package:

```text
com.eba.propertyconnect.propertymanagement.integration.coreconnect
```

Suggested structure:

```text
integration
└── coreconnect
    ├── config
    │   └── CoreConnectSoapConfig.java
    ├── client
    │   ├── CoreCustomerSoapClient.java
    │   ├── CoreInvoiceSoapClient.java
    │   ├── CoreReceiptSoapClient.java
    │   ├── CoreLedgerSoapClient.java
    │   └── CoreCompanySoapClient.java
    ├── domain
    │   ├── CoreCustomerRequest.java
    │   ├── CoreInvoiceRequest.java
    │   └── CoreReceiptRequest.java
    ├── mapper
    │   └── CoreConnectMapper.java
    └── service
        └── CoreConnectIntegrationService.java
```

## 6.2 SOAP Integration Rule

PropertyConnect should not directly insert finance data into ERP tables.

Use SOAP service calls only.

```text
PropertyConnect Lease / Rent / Invoice
        |
        v
CoreConnectIntegrationService
        |
        v
Apache CXF SOAP Client
        |
        v
CoreConnect ERP SOAP Service
```

## 6.3 ERP Reference Columns

PropertyConnect tables should store ERP references after successful SOAP sync.

Recommended common columns:

```sql
erp_company_id BIGINT NULL,
erp_customer_id BIGINT NULL,
erp_supplier_id BIGINT NULL,
erp_invoice_id BIGINT NULL,
erp_receipt_id BIGINT NULL,
erp_gl_account_id BIGINT NULL,
sync_status VARCHAR(50),
sync_error_message TEXT,
last_sync_at DATETIME
```

Recommended sync status values:

```text
PENDING
SYNCED
FAILED
RETRY_REQUIRED
CANCELLED
```

---

# 7. Database Tech Stack

## 7.1 Database

| Area | Recommendation |
|---|---|
| Database | MySQL |
| Migration Tool | Flyway or Liquibase |
| Connection Pool | HikariCP |
| SQL Mapper | MyBatis |
| Table Prefix | `pa_` |

## 7.2 Database Strategy

Recommended database separation:

```text
coreconnect_db      -> ERP database
propertyconnect_db  -> Property Management database
```

This avoids tight coupling and protects the ERP database.

## 7.3 Table Prefix

Use prefix:

```text
pa_
```

Example tables:

```text
pa_property
pa_property_block
pa_floor
pa_unit
pa_unit_type
pa_owner
pa_tenant
pa_lease
pa_lease_charge
pa_rent_schedule
pa_invoice_request
pa_receipt_sync
pa_maintenance_request
pa_inspection
pa_document
pa_approval_workflow
```

---

# 8. Authentication And Authorization

## 8.1 Authentication

Recommended authentication:

```text
JWT Access Token + Refresh Token
```

Login flow:

```text
User Login
    |
    v
Validate user
    |
    v
Return access token and refresh token
    |
    v
User selects company
    |
    v
Load mapped properties and permissions
```

## 8.2 Authorization Model

Recommended access control:

```text
User
Role
Permission
Company
Property
```

Suggested mapping:

```text
User -> Multiple Roles
User -> Multiple Companies
User -> Multiple Properties
Role -> Multiple Permissions
```

Example permissions:

```text
PROPERTY_VIEW
PROPERTY_CREATE
PROPERTY_EDIT
PROPERTY_DELETE

LEASE_VIEW
LEASE_CREATE
LEASE_APPROVE
LEASE_ACTIVATE
LEASE_TERMINATE

RENT_GENERATE
INVOICE_CREATE
RECEIPT_VIEW

MAINTENANCE_CREATE
MAINTENANCE_ASSIGN
MAINTENANCE_CLOSE
```

---

# 9. Master Data Ownership

| Master | Owner System | Notes |
|---|---|---|
| Company | CoreConnect ERP | PropertyConnect should fetch/sync from ERP |
| User | CoreConnect ERP or shared auth | Central user management preferred |
| Role / Permission | PropertyConnect or shared auth | Property-specific permissions required |
| Chart of Accounts | CoreConnect ERP | Finance controlled by ERP |
| Tax | CoreConnect ERP | Tax should remain centralized |
| Currency | CoreConnect ERP | Should be common across ERP |
| Customer / Tenant Financial Account | CoreConnect ERP | Tenant can be created/synced as ERP customer |
| Property | PropertyConnect | Property-specific master |
| Unit | PropertyConnect | Property-specific master |
| Owner | PropertyConnect / ERP supplier mapping | Owner may need ERP supplier reference |
| Lease Type | PropertyConnect | Domain-specific |
| Charge Type | PropertyConnect | Should map to ERP GL account |
| Maintenance Category | PropertyConnect | Domain-specific |
| Document Type | PropertyConnect | Domain-specific |

---

# 10. Reporting Tech Stack

Use JasperReports because CoreConnect ERP already uses JasperReports.

Recommended report flow:

```text
Frontend Request
        |
        v
PropertyConnect Report API
        |
        v
JasperReports Engine
        |
        v
PDF / Excel / CSV Output
```

Recommended report formats:

```text
PDF
Excel
CSV
```

Common Property Management reports:

- Property list report
- Unit availability report
- Tenant list report
- Lease expiry report
- Rent outstanding report
- Rent collection report
- Maintenance request report
- Owner statement
- Property income statement

---

# 11. File And Document Management

## 11.1 Storage

Recommended options:

```text
Option 1: AWS S3
Option 2: Local file storage
Option 3: S3-compatible storage like MinIO
```

Since CoreConnect ERP already has AWS S3 integration, PropertyConnect can also follow the same pattern.

## 11.2 Documents To Store

```text
Property documents
Unit documents
Tenant KYC documents
Lease agreements
Renewal documents
Maintenance images
Inspection images
Owner documents
Invoice PDF copies
Receipt PDF copies
```

Recommended document table:

```text
pa_document
```

Important columns:

```sql
id BIGINT PRIMARY KEY,
entity_type VARCHAR(100),
entity_id BIGINT,
document_type VARCHAR(100),
file_name VARCHAR(255),
file_path TEXT,
file_size BIGINT,
mime_type VARCHAR(100),
uploaded_by BIGINT,
uploaded_at DATETIME
```

---

# 12. Scheduling And Background Jobs

Use Quartz Scheduler.

Recommended scheduled jobs:

```text
Rent generation job
Recurring invoice request job
Late fee calculation job
Lease expiry reminder job
Payment sync job
ERP invoice sync retry job
Document cleanup job
Notification job
```

Example:

```text
Every month 1st day:
Generate rent schedule and invoice request

Every day:
Check lease expiry within 30/60/90 days

Every 15 minutes:
Retry failed ERP SOAP sync
```

---

# 13. Messaging And Async Processing

Use ActiveMQ if the process should not block the user screen.

Recommended async processes:

```text
ERP invoice creation
ERP receipt sync
Report generation
Email notification
Bulk rent generation
Bulk document processing
```

Example async flow:

```text
User clicks Generate Rent
        |
        v
Create rent generation request
        |
        v
Push message to queue
        |
        v
Background worker processes rent generation
        |
        v
Update status
```

---

# 14. Logging And Audit

## 14.1 Logging

Recommended:

```text
SLF4J + Log4j
```

Log important actions:

```text
Login
Company selection
Create / update / delete master
Lease approval
Lease activation
Invoice sync request
SOAP request failure
SOAP response failure
Payment sync
Report generation
```

## 14.2 Audit Table

Recommended table:

```text
pa_audit_log
```

Important columns:

```sql
id BIGINT PRIMARY KEY,
entity_name VARCHAR(100),
entity_id BIGINT,
action VARCHAR(50),
old_value JSON,
new_value JSON,
performed_by BIGINT,
performed_at DATETIME,
ip_address VARCHAR(100)
```

---

# 15. Build And Deployment

## 15.1 Build Tools

| Layer | Tool |
|---|---|
| Frontend | npm / pnpm |
| Backend | Maven |
| Database Migration | Flyway or Liquibase |
| Containerization | Docker |
| Reverse Proxy | Nginx |

## 15.2 Deployment Structure

Recommended deployment:

```text
Nginx
├── propertyconnect-frontend container
├── propertyconnect-backend container
├── mysql database
└── file storage / S3
```

## 15.3 Backend Packaging

For Jakarta EE 10, package backend as:

```text
WAR
```

Deploy to Jakarta EE 10 compatible server.

Recommended servers:

```text
Payara 6
WildFly 30+
Open Liberty
TomEE Jakarta compatible version
```

---

# 16. Suggested Backend Folder Structure

```text
propertyconnect-backend/
├── pom.xml
└── src
    ├── main
    │   ├── java/com/eba
    │   │   └── common
    │   │       ├── exception
    │   │       ├── logging
    │   │       ├── quartz
    │   │       ├── queue  
    │   │       ├── utils  
    │   │       ├── integration
    │   │               ├── erp        
    │   │   └── propertymanagement
    │   │       ├── domain
    │   │       ├── mappers
    │   │       ├── service
    │   └── resources
    └── test
```

---

# 17. Suggested Frontend Folder Structure

```text
src
├── app
│   ├── login
│   ├── select-company
│   ├── dashboard
│   ├── properties
│   ├── units
│   ├── owners
│   ├── tenants
│   ├── leases
│   ├── rent
│   ├── invoices
│   ├── receipts
│   ├── maintenance
│   ├── reports
│   └── settings
├── components
│   ├── common
│   ├── form
│   ├── layout
│   └── table
├── services
│   ├── apiClient.ts
│   ├── propertyService.ts
│   ├── leaseService.ts
│   └── rentService.ts
├── types
├── hooks
├── utils
└── constants
```

---

# 18. Module-Wise Stack Usage

## 18.1 Property Master

| Area | Stack |
|---|---|
| UI | Next.js + PrimeReact DataTable/Form |
| API | JAX-RS REST API |
| Backend | Jakarta EE Service + MyBatis |
| DB | `pa_property` |
| ERP Integration | Optional company mapping |

## 18.2 Unit Master

| Area | Stack |
|---|---|
| UI | Next.js + PrimeReact |
| API | JAX-RS |
| Backend | Jakarta EE + MyBatis |
| DB | `pa_unit`, `pa_unit_type` |
| ERP Integration | No direct ERP sync required |

## 18.3 Tenant Master

| Area | Stack |
|---|---|
| UI | Next.js + PrimeReact |
| API | JAX-RS |
| Backend | Jakarta EE + MyBatis |
| DB | `pa_tenant` |
| ERP Integration | Create/update ERP customer through SOAP |

## 18.4 Lease Management

| Area | Stack |
|---|---|
| UI | Next.js + PrimeReact Wizard/Form |
| API | JAX-RS |
| Backend | Jakarta EE + MyBatis |
| DB | `pa_lease`, `pa_lease_charge` |
| ERP Integration | Customer, invoice, deposit, GL mapping |

## 18.5 Rent Generation

| Area | Stack |
|---|---|
| UI | Next.js screen for rent generation |
| API | JAX-RS |
| Backend | Jakarta EE Service |
| Scheduler | Quartz |
| DB | `pa_rent_schedule`, `pa_invoice_request` |
| ERP Integration | Create ERP invoice through SOAP |

## 18.6 Maintenance Management

| Area | Stack |
|---|---|
| UI | Next.js + PrimeReact |
| API | JAX-RS |
| Backend | Jakarta EE + MyBatis |
| DB | `pa_maintenance_request` |
| ERP Integration | Optional purchase/work order integration |

---

# 19. Recommended Maven Dependencies

## 19.1 Core Jakarta EE

```xml
<dependency>
    <groupId>jakarta.platform</groupId>
    <artifactId>jakarta.jakartaee-api</artifactId>
    <version>10.0.0</version>
    <scope>provided</scope>
</dependency>
```

## 19.2 MyBatis

```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.19</version>
</dependency>
```

## 19.3 MySQL Connector

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>9.2.0</version>
</dependency>
```

## 19.4 HikariCP

```xml
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>6.3.0</version>
</dependency>
```

## 19.5 Apache CXF SOAP Client

```xml
<dependency>
    <groupId>org.apache.cxf</groupId>
    <artifactId>cxf-rt-frontend-jaxws</artifactId>
    <version>4.1.0</version>
</dependency>

<dependency>
    <groupId>org.apache.cxf</groupId>
    <artifactId>cxf-rt-transports-http</artifactId>
    <version>4.1.0</version>
</dependency>

<dependency>
    <groupId>org.apache.cxf</groupId>
    <artifactId>cxf-rt-ws-security</artifactId>
    <version>4.1.0</version>
</dependency>
```

## 19.6 JasperReports

```xml
<dependency>
    <groupId>net.sf.jasperreports</groupId>
    <artifactId>jasperreports</artifactId>
    <version>7.0.0</version>
</dependency>
```

## 19.7 Quartz

```xml
<dependency>
    <groupId>org.quartz-scheduler</groupId>
    <artifactId>quartz</artifactId>
    <version>2.5.0</version>
</dependency>
```

---

# 20. Final Recommended Stack Summary

```text
Frontend:
Next.js + React + TypeScript + PrimeReact + Tailwind CSS

Backend:
Jakarta EE 10 + Java 17 + JAX-RS + CDI + MyBatis

Integration:
Apache CXF SOAP Client to connect with CoreConnect ERP

Database:
MySQL with `pa_` table prefix

Reports:
JasperReports

Scheduler:
Quartz

Messaging:
ActiveMQ, only where async processing is needed

File Storage:
AWS S3 or S3-compatible storage

Deployment:
Docker + Nginx + Jakarta EE Application Server
```

---

# 21. Important Design Decisions

## 21.1 Keep ERP Stable

Do not modify existing ERP screens for Property Management unless required.

Build PropertyConnect as a separate application.

## 21.2 Use SOAP Only Through Backend

All ERP SOAP calls should be handled by backend integration service.

## 21.3 Keep Finance Ownership In ERP

PropertyConnect should handle property, lease, tenant, rent schedule, and maintenance.

CoreConnect ERP should handle:

- Customer financial account
- Invoice
- Receipt
- Tax
- GL posting
- Chart of accounts
- Finance reports

## 21.4 Store ERP References

Every synced transaction should store ERP reference IDs.

## 21.5 Use Retry Mechanism

SOAP integration can fail due to network, validation, or ERP service issues.

Maintain retry status and error logs.

---

# 22. Final Decision

The best tech stack for PropertyConnect is:

```text
Next.js + TypeScript frontend
Jakarta EE 10 + Java 17 backend
MyBatis + MySQL database
Apache CXF SOAP integration with CoreConnect ERP
PrimeReact UI components
JasperReports for reporting
Quartz for scheduled rent and invoice generation
Docker for deployment
```

This stack is modern for the frontend, compatible with the existing ERP backend, and safe for SOAP-based ERP integration.
