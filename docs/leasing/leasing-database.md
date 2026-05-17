# Leasing Database

## Migration

Current migration:

```text
propertyconnect-backend/src/main/resources/db/migration/V001__crm_leasing.sql
```

## Tables

Master:

```text
pa_mst_unit
```

Transactions:

```text
pa_txn_leasing_lead
pa_txn_leasing_prospect
pa_txn_leasing_requirement
pa_txn_leasing_site_visit
pa_txn_leasing_offer
pa_txn_leasing_negotiation
pa_txn_leasing_reservation
pa_txn_leasing_payment_receipt
pa_txn_leasing_status_history
```

## Table Structure

### `pa_mst_unit`

Stores property unit master data used for availability checks and reservation status updates.

Key columns:

```text
id
property_id
property_name
unit_code
unit_type
bedrooms
asking_rent
status
created_by
created_at
updated_by
updated_at
```

### `pa_txn_leasing_lead`

Stores incoming lead records and qualification details.

Key columns:

```text
id
lead_no
customer_name
mobile_no
email
source
purpose
status
qualification_score
qualification_notes
created_by
created_at
updated_by
updated_at
```

### `pa_txn_leasing_prospect`

Stores prospects converted from qualified leads.

Key columns:

```text
id
lead_id
prospect_no
customer_name
mobile_no
email
status
created_by
created_at
updated_by
updated_at
```

### `pa_txn_leasing_requirement`

Stores property and unit requirements for a prospect.

Key columns:

```text
id
company_id
prospect_id
property_id
property_name
unit_type
bedrooms
budget_from
budget_to
move_in_date
notes
created_by
created_at
updated_by
updated_at
```

### `pa_txn_leasing_site_visit`

Stores unit showing and site visit records.

Key columns:

```text
id
company_id
prospect_id
unit_id
visit_at
status
notes
created_by
created_at
updated_by
updated_at
```

### `pa_txn_leasing_offer`

Stores quotations and offers for a prospect/unit.

Key columns:

```text
id
company_id
prospect_id
unit_id
offer_no
base_amount
discount_amount
final_amount
special_terms
status
approval_required
created_by
created_at
updated_by
updated_at
```

### `pa_txn_leasing_negotiation`

Stores negotiation entries against an offer.

Key columns:

```text
id
company_id
offer_id
proposed_amount
notes
status
created_by
created_at
```

### `pa_txn_leasing_reservation`

Stores reservation requests, approval state, payment state, and reservation status.

Key columns:

```text
id
company_id
reservation_no
lead_id
prospect_id
offer_id
property_id
unit_id
status
approval_status
reservation_fee
paid_amount
payment_waived
expires_at
created_by
created_at
updated_by
updated_at
```

### `pa_txn_leasing_payment_receipt`

Stores reservation fee payment receipts.

Key columns:

```text
id
reservation_id
receipt_no
amount
payment_method
paid_at
erp_receipt_id
created_by
created_at
```

### `pa_txn_leasing_status_history`

Stores status changes across leasing entities.

Key columns:

```text
id
entity_type
entity_id
from_status
to_status
comments
changed_by
changed_at
```

## Relationship Summary

```text
pa_txn_leasing_lead
  -> pa_txn_leasing_prospect
      -> pa_txn_leasing_requirement
      -> pa_txn_leasing_site_visit
      -> pa_txn_leasing_offer
          -> pa_txn_leasing_negotiation
          -> pa_txn_leasing_reservation
              -> pa_txn_leasing_payment_receipt
```

Reservation links:

- lead
- prospect
- offer
- property
- unit

## Important Constraints

- `pa_mst_unit` has unique `(property_id, unit_code)`.
- `pa_txn_leasing_lead` has unique `lead_no`.
- `pa_txn_leasing_prospect` has unique `prospect_no`.
- `pa_txn_leasing_prospect` has unique `lead_id`.
- `pa_txn_leasing_offer` has unique `offer_no`.
- `pa_txn_leasing_reservation` has unique `reservation_no`.
- `pa_txn_leasing_payment_receipt` has unique `receipt_no`.

Foreign key rules:

- Prospect references lead.
- Requirement references prospect.
- Site visit references prospect and unit.
- Offer references prospect and unit.
- Negotiation references offer.
- Reservation references lead, prospect, offer, and unit.
- Payment receipt references reservation.

## Audit Fields

Most tables include:

```sql
created_by BIGINT NULL,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_by BIGINT NULL,
updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
```

`pa_txn_leasing_negotiation` and `pa_txn_leasing_payment_receipt` are append-style process records and mainly use create audit fields.
