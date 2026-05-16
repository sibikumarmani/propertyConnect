# Leasing API Endpoints

Base path:

```text
/propertymanagement/crm-leasing
```

## Lead

```text
GET  /propertymanagement/crm-leasing/leads
POST /propertymanagement/crm-leasing/leads
POST /propertymanagement/crm-leasing/leads/{id}/qualify
POST /propertymanagement/crm-leasing/leads/{id}/convert-to-prospect?createdBy={userId}
```

## Prospect

```text
GET /propertymanagement/crm-leasing/prospects
GET /propertymanagement/crm-leasing/prospects/{id}
```

## Requirement

```text
POST /propertymanagement/crm-leasing/requirements
```

## Unit

```text
POST /propertymanagement/crm-leasing/units
POST /propertymanagement/crm-leasing/units/search
```

## Site Visit

```text
POST /propertymanagement/crm-leasing/site-visits
```

## Offer And Negotiation

```text
GET  /propertymanagement/crm-leasing/offers
POST /propertymanagement/crm-leasing/offers
POST /propertymanagement/crm-leasing/negotiations
```

## Reservation

```text
GET  /propertymanagement/crm-leasing/reservations
POST /propertymanagement/crm-leasing/reservations
POST /propertymanagement/crm-leasing/reservations/{id}/approval
POST /propertymanagement/crm-leasing/reservations/{id}/payment
POST /propertymanagement/crm-leasing/reservations/{id}/confirm?updatedBy={userId}
POST /propertymanagement/crm-leasing/reservations/{id}/cancel?updatedBy={userId}
POST /propertymanagement/crm-leasing/reservations/{id}/expire?updatedBy={userId}
POST /propertymanagement/crm-leasing/reservations/{id}/move-to-lease?updatedBy={userId}
```

## Reports

```text
GET /propertymanagement/crm-leasing/reports/summary
```
