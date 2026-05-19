DROP PROCEDURE IF EXISTS pc_add_leasing_column;
DROP PROCEDURE IF EXISTS pc_drop_leasing_column;
DROP PROCEDURE IF EXISTS pc_drop_leasing_index;

DELIMITER //
CREATE PROCEDURE pc_add_leasing_column(IN table_name_value VARCHAR(80), IN column_name_value VARCHAR(80), IN ddl_value TEXT)
BEGIN
    SET @pc_column_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = column_name_value
    );

    SET @pc_sql = IF(@pc_column_exists = 0, ddl_value, 'SELECT 1');
    PREPARE pc_stmt FROM @pc_sql;
    EXECUTE pc_stmt;
    DEALLOCATE PREPARE pc_stmt;
END //

CREATE PROCEDURE pc_drop_leasing_column(IN table_name_value VARCHAR(80), IN column_name_value VARCHAR(80), IN ddl_value TEXT)
BEGIN
    SET @pc_column_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = column_name_value
    );

    SET @pc_sql = IF(@pc_column_exists > 0, ddl_value, 'SELECT 1');
    PREPARE pc_stmt FROM @pc_sql;
    EXECUTE pc_stmt;
    DEALLOCATE PREPARE pc_stmt;
END //

CREATE PROCEDURE pc_drop_leasing_index(IN table_name_value VARCHAR(80), IN index_name_value VARCHAR(120), IN ddl_value TEXT)
BEGIN
    SET @pc_index_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND INDEX_NAME = index_name_value
    );

    SET @pc_sql = IF(@pc_index_exists > 0, ddl_value, 'SELECT 1');
    PREPARE pc_stmt FROM @pc_sql;
    EXECUTE pc_stmt;
    DEALLOCATE PREPARE pc_stmt;
END //
DELIMITER ;

CALL pc_add_leasing_column('pa_txn_leasing_lead', 'preferred_contact_method', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN preferred_contact_method VARCHAR(40) NULL AFTER email');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'preferred_contact_method', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN preferred_contact_method VARCHAR(40) NULL AFTER email');

CALL pc_drop_leasing_index('pa_txn_leasing_lead', 'idx_pa_txn_leasing_lead_commercial_ids', 'ALTER TABLE pa_txn_leasing_lead DROP INDEX idx_pa_txn_leasing_lead_commercial_ids');

CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'trade_license_no', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN trade_license_no');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'cr_number', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN cr_number');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'vat_registration_no', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN vat_registration_no');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'contact_role', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN contact_role');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'contact_title', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN contact_title');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'phone_no', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN phone_no');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'fax_no', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN fax_no');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'address', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN address');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'source', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN source');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'commercial_need', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN commercial_need');
CALL pc_drop_leasing_column('pa_txn_leasing_lead', 'document_notes', 'ALTER TABLE pa_txn_leasing_lead DROP COLUMN document_notes');

DROP PROCEDURE IF EXISTS pc_add_leasing_column;
DROP PROCEDURE IF EXISTS pc_drop_leasing_column;
DROP PROCEDURE IF EXISTS pc_drop_leasing_index;
