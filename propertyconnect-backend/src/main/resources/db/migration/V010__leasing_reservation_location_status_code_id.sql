ALTER TABLE pa_txn_leasing_reservation
    ADD COLUMN block_id BIGINT NULL AFTER property_id,
    ADD COLUMN floor_id BIGINT NULL AFTER block_id;

UPDATE pa_txn_leasing_reservation
SET status = NULL
WHERE status IS NOT NULL
  AND status NOT REGEXP '^[0-9]+$';

UPDATE pa_txn_leasing_reservation
SET approval_status = NULL
WHERE approval_status IS NOT NULL
  AND approval_status NOT REGEXP '^[0-9]+$';

ALTER TABLE pa_txn_leasing_reservation
    MODIFY status INT NULL,
    MODIFY approval_status INT NULL;
