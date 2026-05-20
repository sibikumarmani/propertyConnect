# Mapper And XML Rules

## Purpose

PropertyConnect uses MyBatis mapper interfaces with matching XML mapper files. Keep mapper files process-wise so the code is easy to understand.

## Mapper Interface Location

```text
propertyconnect-backend/src/main/java/com/eba/propertyconnect/propertymanagement/leasing/mapper
```

Current leasing mapper interfaces:

```text
LeadMapper.java
ProspectMapper.java
RequirementMapper.java
UnitMapper.java
SiteVisitMapper.java
OfferMapper.java
NegotiationMapper.java
ReservationMapper.java
PaymentReceiptMapper.java
StatusHistoryMapper.java
```

## XML Mapper Location

```text
propertyconnect-backend/src/main/resources/com/eba/propertyconnect/propertymanagement/leasing/mapper
```

Current leasing XML mappers:

```text
LeadMapper.xml
ProspectMapper.xml
RequirementMapper.xml
UnitMapper.xml
SiteVisitMapper.xml
OfferMapper.xml
NegotiationMapper.xml
ReservationMapper.xml
PaymentReceiptMapper.xml
StatusHistoryMapper.xml
```

## Rules

- Annotate mapper interfaces with `org.mybatis.cdi.Mapper`.
- Keep mapper method names aligned with service actions.
- Keep SQL in XML mapper files.
- Use one mapper per business process or closely related object.
- Do not create one combined mapper for the whole Customer Management module.
- Do not create repository classes.
- Use readable SQL with explicit columns.
- Keep result mappings near the SQL that uses them.
- Update `mybatis-config.xml` only when a new mapper package is added.

## Service Usage

Inject mappers directly into services:

```java
@Inject
private LeadMapper leadMapper;
```

Use service methods for:

- validation
- status transitions
- transaction boundaries
- cache invalidation
- history writes
