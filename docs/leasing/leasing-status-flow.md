# Leasing Status Flow

## Lead Status

```text
NEW
  -> QUALIFIED
      -> CONVERTED_TO_PROSPECT
```

## Prospect Status

```text
ACTIVE
  -> RESERVED
      -> LEASE_PROCESS
```

## Unit Status

Stored in:

```text
pa_mst_unit.status
```

```text
AVAILABLE
  -> RESERVED
      -> AVAILABLE
```

Rules:

- Confirmed reservation sets unit to `RESERVED`.
- Cancelled or expired reservation sets unit to `AVAILABLE`.

## Offer Status

```text
DRAFT
  -> SENT
      -> NEGOTIATION
```

## Negotiation Status

```text
OPEN
```

Additional statuses can be added when negotiation close/accept/reject screens are implemented.

## Reservation Status

Stored in:

```text
pa_txn_leasing_reservation.status
```

Approval required path:

```text
PENDING_APPROVAL
  -> PAYMENT_PENDING
      -> CONFIRMED
          -> MOVED_TO_LEASE
```

Approval rejected path:

```text
PENDING_APPROVAL
  -> REJECTED
```

Approval not required path:

```text
PAYMENT_PENDING
  -> CONFIRMED
      -> MOVED_TO_LEASE
```

Cancellation / expiry:

```text
PENDING_APPROVAL
PAYMENT_PENDING
CONFIRMED
  -> CANCELLED

PENDING_APPROVAL
PAYMENT_PENDING
  -> EXPIRED
```

## Approval Status

Stored in:

```text
pa_txn_leasing_reservation.approval_status
```

```text
NOT_REQUIRED
PENDING
APPROVED
REJECTED
```

## History

All meaningful status changes should be inserted into:

```text
pa_txn_leasing_status_history
```

History rows should capture:

```text
entity_type
entity_id
from_status
to_status
comments
changed_by
changed_at
```
