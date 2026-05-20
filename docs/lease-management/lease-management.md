# Lease Management

Document type: Module overview and process guide  
Application area: PropertyConnect Lease Management  
Scope: Lease contract lifecycle after reservation, plus direct lease creation  

---

## 1. Purpose

This file is the main Lease Management guide for PropertyConnect. Lease Management is a separate authenticated menu group under `/propertyconnect/lease-management`.

Customer Management owns lead, prospect, site visit, offer, negotiation, and reservation. Lease Management starts when an approved reservation is converted to a lease, or when a lease is created directly without reservation.

```text
Approved Reservation OR Direct Lease Request
    -> New Lease
    -> Lease Contract
    -> Approval
    -> Execution
    -> Activation
    -> Active Lease
    -> Amendment / Renewal / Termination
    -> Reports
```

---

## 2. Project Shape

| Area | Value |
|---|---|
| Backend module | `propertymanagement` |
| Backend package root | `com.eba.propertyconnect.propertymanagement` |
| Backend style | Jakarta EE resource, service, MyBatis mapper interface, MyBatis XML |
| Frontend route group | `propertyconnect-frontend/src/app/propertyconnect/lease-management` |
| Frontend menu group | `Lease Management` |
| API style | REST JSON |
| Cache | Apache Commons JCS through `CacheHelper` |
| Upstream module | Customer Management reservation |

Do not add repository classes. Follow the project style: resource, service, mapper interface, mapper XML, database.

---

## 3. Menu Structure

| Menu | Route | Purpose |
|---|---|---|
| Lease Dashboard | `/propertyconnect/lease-management/dashboard` | Lease KPIs, expiring leases, approval aging, occupancy, and financial summary |
| Lease Configuration | `/propertyconnect/lease-management/configuration` | Lease masters, statuses, charge types, approval rules, templates, and document rules |
| Lease Contract | `/propertyconnect/lease-management/contracts` | Search, view, manage, and monitor lease contracts |
| New Lease | `/propertyconnect/lease-management/new-lease` | Create lease from approved reservation or direct lease request |
| Amendment | `/propertyconnect/lease-management/amendments` | Change active lease terms, units, charges, dates, clauses, or parties |
| Renewal | `/propertyconnect/lease-management/renewals` | Renew expiring leases with revised dates, rent, deposits, and terms |
| Termination | `/propertyconnect/lease-management/terminations` | Manage early termination, expiry closure, settlements, move-out, and unit release |
| Reports | `/propertyconnect/lease-management/reports` | Operational, financial, compliance, and management reports |

Keep these pages operational and data-focused.

---

## 4. Core Processes

## New Lease

Supports lease creation from:

- Approved reservation
- Direct lease request

Required validations:

- Customer is active
- Unit is available or reserved for the selected reservation
- No overlapping active lease exists for the same unit and period
- Reservation is approved when lease is created from reservation
- Lease period, rent, deposit, and billing terms pass configured business rules

## Lease Contract

The lease contract is the single source of truth for:

- Tenant and billing customer
- Property, block, floor, unit, and area
- Lease dates and rent commencement
- Charges, deposits, billing frequency, and escalation
- Documents and contract versions
- Approval and status history

## Amendment

Use Amendment for approved changes to an active lease, such as rent revision, date change, unit addition/removal, party change, or clause change.

The original lease history must remain intact. Amendments should create versioned records and write meaningful status history.

## Renewal

Use Renewal when a tenant continues after lease expiry. Renewal can copy the existing lease and allow controlled changes to dates, rent, billing frequency, escalation, deposits, and clauses.

Outstanding balance and policy deviation checks are mandatory before renewal approval.

## Termination

Use Termination for natural expiry closure, early termination, default termination, or mutual termination.

Termination must validate notice period, outstanding balance, penalties, final settlement, move-out inspection, asset return, and unit release.

---

## 5. Status And Code Values

Use master/code-value records for statuses and decisions. Frontend conditions should use the code-value name or a normalized key, not drifting display text.

Reservation handoff rules:

- Reservation status comes from `pa_reservation_status`.
- Reservation approval status comes from `cf_decision`.
- Reservation submit sets reservation `status` to `Pending Approval`.
- Reservation submit sets reservation `approval_status` to `Submitted`.

Suggested lease status lifecycle:

```text
Draft
    -> Under Negotiation
    -> Pending Approval
    -> Approved
    -> Awaiting Signature
    -> Awaiting Payment
    -> Active
    -> Expired / Terminated / Closed
```

Suggested amendment status lifecycle:

```text
Draft
    -> In Review
    -> Approved
    -> Executed
    -> Cancelled
```

---

## 6. Backend Rules

- Keep backend code under `propertyconnect-backend`.
- Keep Lease Management code under the `propertymanagement` backend module.
- Use domain POJOs directly for REST payloads unless a DTO is explicitly requested.
- Keep each domain object in a separate Java file.
- Keep each process mapper in a separate Java interface and XML file.
- Add validation and status transition logic in services.
- Store meaningful status changes in history.
- Clear cache after writes that affect list, report, dashboard, availability, billing, or status reads.
- Keep migration SQL, mapper XML, service report counts, and markdown docs using the same table names.

---

## 7. Frontend Rules

- Keep frontend code under `propertyconnect-frontend`.
- Keep authenticated pages under `/propertyconnect/lease-management`.
- Use separate components and API files for Lease Management processes.
- Do not reuse unrelated Customer Management process files for Lease Management screens.
- Keep screens data-focused with dense, scannable operational layouts.
- Use code-value names or normalized keys for status comparisons.

---

## 8. Reporting

Lease Management reports should cover:

- Active lease report
- Expiry report
- Renewal pipeline
- Amendment tracker
- Termination tracker
- Occupancy report
- Rental revenue report
- Outstanding report
- Deposit liability report
- Approval aging report

---

## 9. Verification

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
