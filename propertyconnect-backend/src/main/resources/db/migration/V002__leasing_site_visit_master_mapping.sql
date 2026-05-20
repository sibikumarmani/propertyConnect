ALTER TABLE pa_txn_leasing_site_visit
    ADD COLUMN block_id BIGINT NULL AFTER requirement_level,
    ADD COLUMN floor_id BIGINT NULL AFTER block_name,
    ADD KEY idx_pa_txn_leasing_visit_block (block_id, visit_at),
    ADD KEY idx_pa_txn_leasing_visit_floor (floor_id, visit_at),
    ADD CONSTRAINT fk_pa_txn_leasing_visit_block FOREIGN KEY (block_id) REFERENCES pa_mst_block(id),
    ADD CONSTRAINT fk_pa_txn_leasing_visit_floor FOREIGN KEY (floor_id) REFERENCES pa_mst_floor(id);

ALTER TABLE pa_txn_leasing_offer
    ADD COLUMN block_id BIGINT NULL AFTER requirement_level,
    ADD COLUMN floor_id BIGINT NULL AFTER block_name,
    ADD KEY idx_pa_txn_leasing_offer_block (block_id, status),
    ADD KEY idx_pa_txn_leasing_offer_floor (floor_id, status),
    ADD CONSTRAINT fk_pa_txn_leasing_offer_block FOREIGN KEY (block_id) REFERENCES pa_mst_block(id),
    ADD CONSTRAINT fk_pa_txn_leasing_offer_floor FOREIGN KEY (floor_id) REFERENCES pa_mst_floor(id);
