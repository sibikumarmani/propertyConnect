# PropertyConnect Project Guide

## Purpose

This is the main instruction and index file for PropertyConnect. Keep this file short. Put detailed rules in process-wise documentation under `docs/`.

## Project Stack

| Area | Value |
|---|---|
| Application | `propertyConnect` |
| Backend module | `propertymanagement` |
| Backend package | `com.eba.propertyconnect.propertymanagement` |
| Backend | Jakarta EE 10, Java 17, MyBatis, MySQL |
| Frontend | Next.js, React, TypeScript |
| API | REST JSON |
| Cache | Apache Commons JCS through `CacheHelper` |
| Master table prefix | `pa_mst_*` |
| Transaction table prefix | `pa_txn_*` |
| Current leasing tables | `pa_mst_customer`, `pa_mst_unit`, `pa_txn_leasing_*` |

## Main Architecture

```text
Next.js Frontend
        |
        | REST JSON
        v
PropertyConnect Backend
Jakarta EE 10 + Java 17 + MyBatis
        |
        v
MySQL PropertyConnect Database
```

Backend layering:

```text
Controller / Resource
        |
        v
Service
        |
        v
Mapper Interface
        |
        v
MyBatis XML Mapper
        |
        v
Database
```

Do not create repository classes for the current backend style. Use MyBatis mapper interfaces and XML mapper files.

## Current Module

The active business module is Customer Management: commercial customer lead to reservation.

Current package:

```text
com.eba.propertyconnect.propertymanagement.leasing
```

Current frontend route group:

```text
propertyconnect-frontend/src/app/propertyconnect/customer-management
```

## Key Project Rules

- Keep backend code under `propertyconnect-backend`.
- Keep frontend code under `propertyconnect-frontend`.
- Use domain POJOs directly for current leasing REST payloads.
- Do not recreate the removed DTO folder unless requested.
- Keep each domain object in a separate Java file.
- Keep each process mapper in a separate Java interface and XML file.
- Add validation and status transition logic in services.
- Store meaningful status changes in history.
- Clear cache after writes that affect list, report, or availability reads.
- Keep migration SQL, mapper XML, service report counts, and markdown docs using the same table names.
- Keep authenticated frontend routes under `/propertyconnect`.
- Keep module pages operational and data-focused.

## Documentation Index

Backend:

- [Backend Architecture](docs/backend/architecture.md)
- [Mapper And XML Rules](docs/backend/mapper-xml-rules.md)
- [Cache Process](docs/backend/cache-process.md)
- [Database Rules](docs/backend/database-rules.md)

Frontend:

- [Layout Design](docs/frontend/layout-design.md)
- [Component Patterns](docs/frontend/component-patterns.md)

Customer Management:

- [Leasing Module](docs/leasing/leasing.md)

## Verification

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
