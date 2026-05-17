# Leasing API Endpoints

Base path:

```text
/propertymanagement/customer-management
```

## Lead

```text
GET  /propertymanagement/customer-management/leads
POST /propertymanagement/customer-management/leads
POST /propertymanagement/customer-management/leads/{id}/qualify
POST /propertymanagement/customer-management/leads/{id}/convert-to-prospect?createdBy={userId}
```

## Prospect

```text
GET /propertymanagement/customer-management/prospects
GET /propertymanagement/customer-management/prospects/{id}
```

## Requirement

```text
POST /propertymanagement/customer-management/requirements
```

## Unit

```text
POST /propertymanagement/customer-management/units
POST /propertymanagement/customer-management/units/search
```

## Site Visit

```text
POST /propertymanagement/customer-management/site-visits
```

## Offer And Negotiation

```text
GET  /propertymanagement/customer-management/offers
POST /propertymanagement/customer-management/offers
POST /propertymanagement/customer-management/negotiations
```

## Reservation

```text
GET  /propertymanagement/customer-management/reservations
POST /propertymanagement/customer-management/reservations
POST /propertymanagement/customer-management/reservations/{id}/approval
POST /propertymanagement/customer-management/reservations/{id}/payment
POST /propertymanagement/customer-management/reservations/{id}/confirm?updatedBy={userId}
POST /propertymanagement/customer-management/reservations/{id}/cancel?updatedBy={userId}
POST /propertymanagement/customer-management/reservations/{id}/expire?updatedBy={userId}
POST /propertymanagement/customer-management/reservations/{id}/move-to-lease?updatedBy={userId}
```

## Reports

```text
GET /propertymanagement/customer-management/reports/summary
```
