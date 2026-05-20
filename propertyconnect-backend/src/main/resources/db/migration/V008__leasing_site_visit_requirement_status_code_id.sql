UPDATE pa_txn_leasing_site_visit
SET requirement_level = NULL
WHERE requirement_level IS NOT NULL
  AND requirement_level NOT REGEXP '^[0-9]+$';

UPDATE pa_txn_leasing_site_visit
SET status = NULL
WHERE status IS NOT NULL
  AND status NOT REGEXP '^[0-9]+$';

ALTER TABLE pa_txn_leasing_site_visit
    MODIFY requirement_level INT NULL,
    MODIFY status INT NULL;
