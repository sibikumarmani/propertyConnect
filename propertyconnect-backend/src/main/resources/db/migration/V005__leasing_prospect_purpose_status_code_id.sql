UPDATE pa_txn_leasing_prospect
SET purpose = NULL
WHERE purpose IS NOT NULL
  AND purpose NOT REGEXP '^[0-9]+$';

UPDATE pa_txn_leasing_prospect
SET status = NULL
WHERE status IS NOT NULL
  AND status NOT REGEXP '^[0-9]+$';

ALTER TABLE pa_txn_leasing_prospect
    MODIFY purpose INT NULL,
    MODIFY status INT NULL;
