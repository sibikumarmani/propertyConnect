# Backend Architecture

## Stack

PropertyConnect backend uses:

- Jakarta EE 10
- Java 17
- JAX-RS resources
- CDI injection
- MyBatis mapper interfaces and XML mapper files
- MySQL
- Apache Commons JCS cache
- Maven WAR packaging

## Package Root

```text
com.eba.propertyconnect.propertymanagement
```

Current backend structure:

```text
propertyconnect-backend/src/main/java/com/eba/propertyconnect/propertymanagement
├── api
├── auth
│   ├── controller
│   ├── domain
│   └── service
├── db
├── exception
├── leasing
│   ├── controller
│   ├── domain
│   ├── mapper
│   └── service
└── util
```

## Layering

```text
Resource
  -> Service
  -> Mapper interface
  -> XML mapper
  -> Database
```

Rules:

- Keep REST endpoints in `controller` packages.
- Keep business rules and validation in services.
- Keep SQL in XML mapper files.
- Use `@Inject` for service and mapper dependencies.
- Use `@Transactional(rollbackFor = Exception.class)` for multi-table writes.
- Do not add repository classes for the current style.
- Do not expose database logic from controllers.

## Domain Model

The current leasing module uses POJOs directly for REST payloads.

Rules:

- Keep every POJO in a separate file.
- Keep domain names business-readable.
- Use audit fields consistently where needed.
- Keep status fields as strings unless a module requires stricter enum mapping.
- Do not add DTO classes unless the project direction changes.

## Current Leasing Backend Files

Controller:

```text
propertyconnect-backend/src/main/java/com/eba/propertyconnect/propertymanagement/leasing/controller/LeasingResource.java
```

Service:

```text
propertyconnect-backend/src/main/java/com/eba/propertyconnect/propertymanagement/leasing/service/LeasingService.java
```

Domain:

```text
propertyconnect-backend/src/main/java/com/eba/propertyconnect/propertymanagement/leasing/domain
```

Mapper interfaces:

```text
propertyconnect-backend/src/main/java/com/eba/propertyconnect/propertymanagement/leasing/mapper
```

XML mappers:

```text
propertyconnect-backend/src/main/resources/com/eba/propertyconnect/propertymanagement/leasing/mapper
```
