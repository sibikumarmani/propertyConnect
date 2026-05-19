SET @pc_negotiation_company_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_negotiation'
      AND COLUMN_NAME = 'company_id'
);

SET @pc_sql = IF(
    @pc_negotiation_company_column_exists = 0,
    'ALTER TABLE pa_txn_leasing_negotiation ADD COLUMN company_id BIGINT NULL AFTER id',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

UPDATE pa_txn_leasing_negotiation negotiation
JOIN pa_txn_leasing_offer offer ON offer.id = negotiation.offer_id
SET negotiation.company_id = offer.company_id
WHERE negotiation.company_id IS NULL;

ALTER TABLE pa_txn_leasing_negotiation MODIFY company_id BIGINT NOT NULL;

SET @pc_negotiation_company_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_negotiation'
      AND INDEX_NAME = 'idx_pa_txn_leasing_neg_company'
);

SET @pc_sql = IF(
    @pc_negotiation_company_index_exists = 0,
    'CREATE INDEX idx_pa_txn_leasing_neg_company ON pa_txn_leasing_negotiation (company_id)',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;
