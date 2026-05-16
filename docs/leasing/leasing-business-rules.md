# Leasing Business Rules

## Lead Rules

- Lead must have customer name.
- Lead must have mobile number.
- New leads default to `NEW`.
- Lead qualification score must be at least `60`.
- Qualified leads move to `QUALIFIED`.

## Prospect Rules

- Only `QUALIFIED` leads can be converted to prospects.
- Converted leads move to `CONVERTED_TO_PROSPECT`.
- New prospects default to `ACTIVE`.

## Requirement Rules

- Requirement must belong to a prospect.
- Budget from cannot be greater than budget to.

## Unit Rules

- Unit master data is stored in `pa_mst_unit`.
- Unit must belong to a property.
- Unit must have property name, unit code, and unit type.
- New units default to `AVAILABLE`.
- Only `AVAILABLE` units can be selected for site visit or reservation.

## Offer Rules

- Offer must belong to a prospect and unit.
- Offer base amount is required and must be greater than zero.
- Final amount is base amount minus discount unless explicitly provided.
- Discount or special terms require approval.
- Created offers move to `SENT`.

## Negotiation Rules

- Negotiation must belong to an offer.
- Proposed amount is required and must be greater than zero.
- Creating a negotiation updates offer status to `NEGOTIATION`.

## Reservation Rules

- Reservation workflow data is stored in `pa_txn_leasing_reservation`.
- Reservation must belong to a prospect and offer.
- Offer must belong to the selected prospect.
- Selected unit must be `AVAILABLE`.
- A unit cannot have more than one active reservation.
- Reservation links lead, prospect, offer, property, and unit.
- If approval is required, reservation status becomes `PENDING_APPROVAL`.
- If approval is not required, reservation status becomes `PAYMENT_PENDING`.
- Reservation cannot be confirmed unless approved and paid or payment is waived.
- Confirmed reservation sets unit status to `RESERVED`.
- Cancelled or expired reservation sets unit status back to `AVAILABLE`.
- Confirmed reservation can move to lease / booking / contract process.

## History Rules

- Store important status changes in `pa_txn_leasing_status_history`.
- History should include entity type, entity id, from status, to status, comments, changed by, and changed at.
