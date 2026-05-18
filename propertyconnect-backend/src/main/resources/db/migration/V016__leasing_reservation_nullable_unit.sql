ALTER TABLE pa_txn_leasing_reservation
    MODIFY unit_id BIGINT NULL,
    MODIFY status VARCHAR(50) NOT NULL DEFAULT 'DRAFT';
