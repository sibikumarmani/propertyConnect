# Lead To Reservation Process

## Purpose

This document describes the Customer management process implemented in PropertyConnect.

Backend module:

```text
com.eba.propertyconnect.propertymanagement.leasing
```

Frontend route group:

```text
propertyconnect-frontend/src/app/propertyconnect/customer-management
```

## Process Steps

1. Lead Creation
2. Lead Qualification
3. Convert Lead to Prospect
4. Property / Unit Requirement Capture
5. Unit Search and Availability Check
6. Unit Showing / Site Visit
7. Quotation / Offer
8. Negotiation
9. Reservation Request
10. Approval if required
11. Reservation Fee Collection
12. Unit Reserved
13. Move to Lease / Booking / Contract Process

## Screen Mapping

```text
leads
lead-entry
qualification
convert-prospect
prospect-profile
requirements
unit-search
site-visit
offers
negotiation
reservation-request
reservation-approval
reservation-payment
reservation-confirmation
reports
```

## Backend Mapping

Controller:

```text
LeasingResource.java
```

Service:

```text
LeasingService.java
```

Process mappers:

```text
LeadMapper
ProspectMapper
RequirementMapper
UnitMapper
SiteVisitMapper
OfferMapper
NegotiationMapper
ReservationMapper
PaymentReceiptMapper
StatusHistoryMapper
```
