# Leasing Module

Document type: Module overview and documentation index  
Application area: PropertyConnect Customer Management  
Scope: Commercial leasing lead to reservation  

---

## 1. Purpose

This file is the main leasing module guide for PropertyConnect. Keep leasing business process, implementation rules, table references, and verification notes here unless a future process becomes large enough to split out.

Current leasing scope covers commercial customer enquiry through reservation:

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

Lease agreement generation, lease activation, renewal, amendment, termination, tenant move-in, and finance posting beyond reservation receipt are outside the current leasing scope.

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
| Cache scope | `leasing` through `CacheHelper` |

Do not add repository classes for this module. Keep the current mapper interface plus mapper XML style.

---

## 3. Related Documentation

| Document | Purpose |
|---|---|
| [Backend Architecture](../backend/architecture.md) | Backend layering and module structure |
| [Mapper And XML Rules](../backend/mapper-xml-rules.md) | MyBatis mapper and XML conventions |
| [Cache Process](../backend/cache-process.md) | Cache behavior and invalidation rules |
| [Database Rules](../backend/database-rules.md) | Migration and table naming rules |

---

## 4. Current Frontend Pages

| Page | Route file |
|---|---|
| Customer dashboard | `propertyconnect-frontend/src/app/propertyconnect/customer-management/customer-dashboard/page.tsx` |
| Leads | `propertyconnect-frontend/src/app/propertyconnect/customer-management/leads/page.tsx` |
| Prospects | `propertyconnect-frontend/src/app/propertyconnect/customer-management/prospects/page.tsx` |
| Reservations | `propertyconnect-frontend/src/app/propertyconnect/customer-management/reservations/page.tsx` |
| Reports | `propertyconnect-frontend/src/app/propertyconnect/customer-management/reports/page.tsx` |

Keep authenticated leasing routes under `/propertyconnect`.

---

## 5. Current Backend Objects

| Object | Purpose |
|---|---|
| `Customer` | Commercial customer master payload |
| `Lead` | Initial enquiry and qualification |
| `Prospect` | Qualified opportunity stage |
| `Requirement` | Property, block, floor, unit, area, budget, and usage requirement |
| `SiteVisit` | Commercial showing or inspection |
| `Offer` | Commercial offer/proposal |
| `Negotiation` | Customer counter-offer or revised term |
| `Reservation` | Reservation request and confirmation |
| `PaymentReceipt` | Reservation fee receipt |
| `StatusHistory` | Status audit trail |
| `Unit` | Unit master and availability |

Keep each domain object in its own Java file.

---

## 6. Current Tables

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

## 7. Core Rules

- Use domain POJOs directly for current leasing REST payloads.
- Do not recreate the removed DTO folder unless requested.
- Add validation and status transition logic in `LeasingService`.
- Store meaningful status changes in `pa_txn_leasing_status_history`.
- Clear leasing cache after writes that affect list, report, or availability reads.
- Reservation `lead_id` is nullable.
- Reservation `unit_id` is nullable until a unit-level reservation needs to block inventory.
- Confirmed reservations with a selected unit must update the unit to `RESERVED`.
- Cancelled and expired reservations with a selected unit must release the unit to `AVAILABLE`.

---

## 8. Verification

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
