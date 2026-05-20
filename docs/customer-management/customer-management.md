# Customer Management

Document type: Module overview and documentation index  
Application area: PropertyConnect Customer Management  
Scope: Commercial customer lead to reservation  

---

## 1. Purpose

This file is the main Customer Management guide for PropertyConnect. It documents the current lead-to-reservation process implemented under the backend `leasing` package and the frontend Customer Management route group.

Current Customer Management scope covers commercial customer enquiry through reservation:

```text
Customer Search
    -> Lead
    -> Qualification
    -> Prospect / Opportunity
    -> Requirement
    -> Site Visit
    -> Offer
    -> Negotiation
    -> Reservation
    -> Move To Lease
```

Lease agreement generation, lease activation, renewal, amendment, termination, tenant move-in, and finance posting beyond reservation receipt are outside the Customer Management scope. Those processes belong to [Lease Management](../lease-management/lease-management.md).

The `move-to-lease` action is currently a handoff point. It updates the reservation workflow state and prepares the record for the separate Lease Management module.

---

## 2. Current Project Shape

| Area | Value |
|---|---|
| Backend module | `propertymanagement` |
| Backend package | `com.eba.propertyconnect.propertymanagement.leasing` |
| Backend resource | `LeasingResource` |
| Backend service | `LeasingService` |
| Backend style | Jakarta EE resource, service, MyBatis mapper interface, MyBatis XML |
| Frontend route group | `propertyconnect-frontend/src/app/propertyconnect/customer-management` |
| REST base path | `/propertymanagement/customer-management` |
| Cache scope | `leasing` through `CacheHelper` because the current backend package is named `leasing` |

Do not add repository classes for this module. Keep the current mapper interface plus mapper XML style.

---

## 3. Related Documentation

| Document | Purpose |
|---|---|
| [Backend Architecture](../backend/architecture.md) | Backend layering and module structure |
| [Mapper And XML Rules](../backend/mapper-xml-rules.md) | MyBatis mapper and XML conventions |
| [Cache Process](../backend/cache-process.md) | Cache behavior and invalidation rules |
| [Database Rules](../backend/database-rules.md) | Migration and table naming rules |
| [Lease Management](../lease-management/lease-management.md) | Lease contract lifecycle after reservation |

---

## 4. Current Frontend Pages

| Page | Route file | Main component/API |
|---|---|---|
| Customer dashboard | `propertyconnect-frontend/src/app/propertyconnect/customer-management/customer-dashboard/page.tsx` | Dashboard page |
| Leads | `propertyconnect-frontend/src/app/propertyconnect/customer-management/leads/page.tsx` | `src/components/lead/lead.tsx`, `src/lib/lead.ts` |
| Prospects | `propertyconnect-frontend/src/app/propertyconnect/customer-management/prospects/page.tsx` | `src/components/prospect/prospect.tsx`, `src/lib/prospect.ts` |
| Reservations | `propertyconnect-frontend/src/app/propertyconnect/customer-management/reservations/page.tsx` | `src/components/reservation/reservation.tsx`, `src/lib/reservation.ts` |
| Reports | `propertyconnect-frontend/src/app/propertyconnect/customer-management/reports/page.tsx` | Reports page |

Keep authenticated Customer Management routes under `/propertyconnect/customer-management`. Do not place Lease Management screens in this route group.

---

## 5. Current REST API

Base path:

```text
/propertymanagement/customer-management
```

| Area | Endpoints |
|---|---|
| Customers | `GET /customers` |
| ERP code values | `GET /erp-code-values` |
| Leads | `GET /leads`, `POST /leads`, `PUT /leads/{id}`, `POST /leads/{id}/qualify`, `POST /leads/{id}/convert-to-prospect` |
| Prospects | `GET /prospects`, `GET /prospects/{id}`, `PUT /prospects/{id}` |
| Prospect child data | `GET /prospects/{id}/requirements`, `GET /prospects/{id}/site-visits`, `GET /prospects/{id}/offers`, `GET /prospects/{id}/reservations` |
| Requirements | `POST /requirements`, `PUT /requirements/{id}` |
| Units | `POST /units`, `POST /units/search` |
| Site visits | `POST /site-visits`, `PUT /site-visits/{id}` |
| Offers | `GET /offers`, `POST /offers`, `PUT /offers/{id}`, `POST /offers/{id}/approval`, `POST /offers/{id}/status` |
| Negotiations | `POST /negotiations` |
| Reservations | `GET /reservations`, `POST /reservations`, `PUT /reservations/{id}`, `POST /reservations/{id}/approval`, `POST /reservations/{id}/status`, `POST /reservations/{id}/payment`, `POST /reservations/{id}/confirm`, `POST /reservations/{id}/cancel`, `POST /reservations/{id}/expire`, `POST /reservations/{id}/move-to-lease` |
| Reports | `GET /reports/summary` |

---

## 6. Current Backend Objects

| Object | Purpose |
|---|---|
| `ApprovalRequest` | Offer and reservation approval payload |
| `BusinessParty` | Customer/business party lookup payload |
| `Customer` | Commercial customer master payload |
| `ErpCodeValue` | ERP code-value payload used for statuses and decisions |
| `Lead` | Initial enquiry and qualification |
| `Negotiation` | Customer counter-offer or revised term |
| `OfferStatusRequest` | Offer status transition payload |
| `Prospect` | Qualified opportunity stage |
| `QualificationRequest` | Lead qualification payload |
| `ReportSummary` | Customer Management summary report payload |
| `Requirement` | Property, block, floor, unit, area, budget, and usage requirement |
| `ReservationStatusRequest` | Reservation status transition payload |
| `SiteVisit` | Commercial showing or inspection |
| `Offer` | Commercial offer/proposal |
| `Reservation` | Reservation request and confirmation |
| `PaymentReceipt` | Reservation fee receipt |
| `StatusHistory` | Status audit trail |
| `Unit` | Unit master and availability |
| `UnitSearch` | Unit availability search payload |

Keep each domain object in its own Java file.

---

## 7. Current Tables

| Table | Purpose |
|---|---|
| `pa_mst_unit` | Unit master and availability |
| `pa_txn_leasing_lead` | Initial enquiry |
| `pa_txn_leasing_prospect` | Qualified opportunity |
| `pa_txn_leasing_requirement` | Requirement details |
| `pa_txn_leasing_site_visit` | Site visit details |
| `pa_txn_leasing_offer` | Offer/proposal |
| `pa_txn_leasing_negotiation` | Negotiation details |
| `pa_txn_leasing_reservation` | Reservation lifecycle |
| `pa_txn_leasing_payment_receipt` | Reservation payment receipt |
| `pa_txn_leasing_status_history` | Status history |

Migration SQL, mapper XML, service report counts, and markdown docs must use the same table names.

---

## 8. Code Values And Status Rules

The module stores status and approval fields as ERP code-value IDs. Services should resolve and validate IDs through `ErpCodeValueService`; frontend conditions should compare code-value names or normalized keys, not raw IDs or unstable display labels.

| Process | Field | Code type |
|---|---|---|
| Lead | `status` | `oc_lead_status` |
| Prospect | `status` | `oc_prospect_status` |
| Requirement | requirement level | `pa_requirement_level` |
| Site visit | `status` | `pa_site_visit_status` |
| Offer | `status` | `pa_offer_status` |
| Reservation | `status` | `pa_reservation_status` |
| Reservation approval | `approval_status` | `cf_decision` |
| Customer firm type | firm type | `cf_firm_type` |

Reservation submit behavior:

- Reservation card submit and popup submit must set reservation `status` to `Pending Approval`.
- Reservation card submit and popup submit must set reservation `approval_status` to `Submitted`.
- In backend keys this means `status = PENDING_APPROVAL` from `pa_reservation_status` and `approval_status = SUBMITTED` from `cf_decision`.
- Do not use `Pending` as reservation approval status.

Site visit behavior:

- Site visit status must come from `pa_site_visit_status`.
- Site visit creation defaults to the configured scheduled status when a valid status is not supplied.

---

## 9. Core Rules

- Use domain POJOs directly for current Customer Management REST payloads.
- Do not recreate the removed DTO folder unless requested.
- Add validation and status transition logic in `LeasingService`.
- Store meaningful status changes in `pa_txn_leasing_status_history`.
- Clear the Customer Management cache after writes that affect list, report, or availability reads.
- Code-value lookup belongs in services; React code should use resolved code-value names or normalized keys for conditions.
- Reservation `lead_id` is nullable.
- Reservation `unit_id` is nullable until a unit-level reservation needs to block inventory.
- Confirmed reservations with a selected unit must update the unit to `RESERVED`.
- Cancelled and expired reservations with a selected unit must release the unit to `AVAILABLE`.
- Reservation move-to-lease must remain a handoff to Lease Management and must not implement contract activation inside Customer Management.

---

## 10. Process Boundary

Customer Management owns:

- Customer search
- Lead capture and qualification
- Prospect creation and tracking
- Requirements
- Site visits
- Offers and negotiations
- Reservation request, approval, payment, confirmation, cancellation, expiry, and move-to-lease handoff

The downstream lease contract lifecycle is documented separately in [Lease Management](../lease-management/lease-management.md). Do not add lease contract, amendment, renewal, or termination process details to this Customer Management document.

---

## 11. Verification

Backend:

```bash
cd propertyconnect-backend
mvn clean package
```

Frontend:

```bash
cd propertyconnect-frontend
npm run lint
npm run build
```

Run the relevant build when code changes are made. Documentation-only changes do not require a build.
