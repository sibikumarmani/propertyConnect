UPDATE pa_txn_leasing_prospect
SET status = 'PROSPECT'
WHERE status = 'PROSPECT_CREATED';

UPDATE pa_txn_leasing_status_history
SET from_status = 'PROSPECT'
WHERE entity_type = 'PROSPECT'
  AND from_status = 'PROSPECT_CREATED';

UPDATE pa_txn_leasing_status_history
SET to_status = 'PROSPECT'
WHERE entity_type = 'PROSPECT'
  AND to_status = 'PROSPECT_CREATED';

ALTER TABLE pa_txn_leasing_prospect
    ALTER COLUMN status SET DEFAULT 'PROSPECT';
