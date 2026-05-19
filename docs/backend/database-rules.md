# Database Rules

## Database

PropertyConnect uses MySQL.

Migration files:

```text
propertyconnect-backend/src/main/resources/db/migration
```

Current leasing migration:

```text
V001__crm_leasing.sql
```

## Naming

Use clear table prefixes:

- `pa_mst_*` for master tables
- `pa_txn_*` for transaction tables

Current leasing tables use `pa_mst_unit` for unit master data and `pa_txn_leasing_*` for the leasing workflow.

Current CRM leasing tables:

```text
pa_mst_unit
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

## Column Rules

Use audit columns where applicable:

```sql
created_by BIGINT NULL,
created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_by BIGINT NULL,
updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
```

Use status columns for workflow state:

```sql
status VARCHAR(50) NOT NULL
```

Use `active_status` on master tables as a Y/N flag:

```sql
active_status ENUM('Y','N') NOT NULL DEFAULT 'Y'
```

Use history tables for important status transitions.

## Leasing Table Types

Master table:

```text
pa_mst_unit
```

Transaction tables:

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

Use master tables for stable reference data. Use transaction tables for workflow records, status movement, receipts, and history.

## SQL Rules

- Use explicit column names.
- Add indexes for status, foreign key, and lookup fields.
- Add unique keys for business numbers such as lead number and reservation number.
- Add foreign keys for strong business relationships.
- Keep migration scripts grouped by module/process.
- Do not add unrelated tables into a module migration.
- Keep mapper XML table names synchronized with migration table names.
