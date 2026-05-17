SET @pc_prospect_company_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_prospect'
      AND COLUMN_NAME = 'company_id'
);

SET @pc_sql = IF(
    @pc_prospect_company_column_exists = 0,
    'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN company_id BIGINT NULL AFTER id',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

UPDATE pa_txn_leasing_prospect prospect
JOIN pa_txn_leasing_lead lead ON lead.id = prospect.lead_id
SET prospect.company_id = lead.company_id
WHERE prospect.company_id IS NULL;

ALTER TABLE pa_txn_leasing_prospect MODIFY company_id BIGINT NOT NULL;

SET @pc_prospect_company_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_prospect'
      AND INDEX_NAME = 'idx_pa_txn_leasing_prospect_company'
);

SET @pc_sql = IF(
    @pc_prospect_company_index_exists = 0,
    'CREATE INDEX idx_pa_txn_leasing_prospect_company ON pa_txn_leasing_prospect (company_id)',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;
