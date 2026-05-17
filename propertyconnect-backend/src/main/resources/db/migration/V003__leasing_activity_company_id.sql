SET @pc_requirement_company_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_requirement'
      AND COLUMN_NAME = 'company_id'
);

SET @pc_sql = IF(
    @pc_requirement_company_column_exists = 0,
    'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN company_id BIGINT NULL AFTER id',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

UPDATE pa_txn_leasing_requirement requirement
JOIN pa_txn_leasing_prospect prospect ON prospect.id = requirement.prospect_id
SET requirement.company_id = prospect.company_id
WHERE requirement.company_id IS NULL;

ALTER TABLE pa_txn_leasing_requirement MODIFY company_id BIGINT NOT NULL;

SET @pc_requirement_company_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_requirement'
      AND INDEX_NAME = 'idx_pa_txn_leasing_req_company'
);

SET @pc_sql = IF(
    @pc_requirement_company_index_exists = 0,
    'CREATE INDEX idx_pa_txn_leasing_req_company ON pa_txn_leasing_requirement (company_id)',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

SET @pc_visit_company_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_site_visit'
      AND COLUMN_NAME = 'company_id'
);

SET @pc_sql = IF(
    @pc_visit_company_column_exists = 0,
    'ALTER TABLE pa_txn_leasing_site_visit ADD COLUMN company_id BIGINT NULL AFTER id',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

UPDATE pa_txn_leasing_site_visit site_visit
JOIN pa_txn_leasing_prospect prospect ON prospect.id = site_visit.prospect_id
SET site_visit.company_id = prospect.company_id
WHERE site_visit.company_id IS NULL;

ALTER TABLE pa_txn_leasing_site_visit MODIFY company_id BIGINT NOT NULL;

SET @pc_visit_company_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_site_visit'
      AND INDEX_NAME = 'idx_pa_txn_leasing_visit_company'
);

SET @pc_sql = IF(
    @pc_visit_company_index_exists = 0,
    'CREATE INDEX idx_pa_txn_leasing_visit_company ON pa_txn_leasing_site_visit (company_id)',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;
