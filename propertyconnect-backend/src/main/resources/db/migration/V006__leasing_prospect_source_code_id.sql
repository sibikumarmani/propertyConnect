UPDATE pa_txn_leasing_prospect
SET source = NULL
WHERE source IS NOT NULL
  AND source NOT REGEXP '^[0-9]+$';

ALTER TABLE pa_txn_leasing_prospect
    MODIFY source INT NULL;
