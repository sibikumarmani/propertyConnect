SET @pc_offer_company_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_offer'
      AND COLUMN_NAME = 'company_id'
);

SET @pc_sql = IF(
    @pc_offer_company_column_exists = 0,
    'ALTER TABLE pa_txn_leasing_offer ADD COLUMN company_id BIGINT NULL AFTER id',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

UPDATE pa_txn_leasing_offer offer
JOIN pa_txn_leasing_prospect prospect ON prospect.id = offer.prospect_id
SET offer.company_id = prospect.company_id
WHERE offer.company_id IS NULL;

ALTER TABLE pa_txn_leasing_offer MODIFY company_id BIGINT NOT NULL;

SET @pc_offer_company_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_offer'
      AND INDEX_NAME = 'idx_pa_txn_leasing_offer_company'
);

SET @pc_sql = IF(
    @pc_offer_company_index_exists = 0,
    'CREATE INDEX idx_pa_txn_leasing_offer_company ON pa_txn_leasing_offer (company_id)',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;
