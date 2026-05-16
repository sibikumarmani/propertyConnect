# Cache Process

## Purpose

PropertyConnect uses cache to reduce repeated list, report, and short-lived search queries.

Cache helper:

```text
propertyconnect-backend/src/main/java/com/eba/propertyconnect/propertymanagement/util/CacheHelper.java
```

Cache config:

```text
propertyconnect-backend/src/main/resources/cache.ccf
```

## Cache Regions

`companyCache`

- Stable module reads
- Lists
- Report summaries

`globalCache`

- Application-level shared data
- Use only when the value is not company or user specific

`shortCache`

- Short-lived search results
- Current example: available unit search

## Leasing Cache Usage

Cached in `LeasingService`:

- lead list
- prospect list
- offer list
- reservation list
- report summary
- available unit search

## Invalidation Rules

Clear leasing cache after:

- lead creation
- lead qualification
- lead to prospect conversion
- requirement save
- unit creation
- site visit creation
- offer creation
- negotiation creation
- reservation request
- reservation approval
- payment receipt
- reservation confirmation
- reservation cancellation
- reservation expiry
- move to lease

Do not cache write operations.

## Implementation Rule

Cache should be handled in the service layer, not in controllers and not in XML mappers.
