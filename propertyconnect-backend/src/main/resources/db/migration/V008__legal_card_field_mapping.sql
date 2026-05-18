ALTER TABLE pa_txn_legal_card
    ADD COLUMN property_id BIGINT NOT NULL DEFAULT 0 AFTER tenant_id,
    ADD COLUMN unit_id BIGINT NOT NULL DEFAULT 0 AFTER property_id,
    CHANGE COLUMN priority_code priority ENUM('H', 'M', 'L') NOT NULL DEFAULT 'M',
    CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE pa_txn_legal_card_attachment
    MODIFY COLUMN storage_path VARCHAR(500) NULL,
    CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE pa_txn_legal_card_timeline
    CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    DROP INDEX idx_pa_txn_legal_card_timeline_card,
    ADD KEY idx_pa_txn_legal_card_timeline_card (legal_card_id, created_on);
