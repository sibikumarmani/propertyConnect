DROP PROCEDURE IF EXISTS pc_add_legal_column;
DROP PROCEDURE IF EXISTS pc_rename_legal_column;
DROP PROCEDURE IF EXISTS pc_drop_legal_index;
DROP PROCEDURE IF EXISTS pc_add_legal_index;

DELIMITER //
CREATE PROCEDURE pc_add_legal_column(IN table_name_value VARCHAR(80), IN column_name_value VARCHAR(80), IN ddl_value TEXT)
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

CREATE PROCEDURE pc_rename_legal_column(IN table_name_value VARCHAR(80), IN old_column_name_value VARCHAR(80), IN new_column_name_value VARCHAR(80), IN ddl_value TEXT)
BEGIN
    SET @pc_old_column_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = old_column_name_value
    );

    SET @pc_new_column_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = new_column_name_value
    );

    SET @pc_sql = IF(@pc_old_column_exists > 0 AND @pc_new_column_exists = 0, ddl_value, 'SELECT 1');
    PREPARE pc_stmt FROM @pc_sql;
    EXECUTE pc_stmt;
    DEALLOCATE PREPARE pc_stmt;
END //

CREATE PROCEDURE pc_drop_legal_index(IN table_name_value VARCHAR(80), IN index_name_value VARCHAR(120), IN ddl_value TEXT)
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

CREATE PROCEDURE pc_add_legal_index(IN table_name_value VARCHAR(80), IN index_name_value VARCHAR(120), IN ddl_value TEXT)
BEGIN
    SET @pc_index_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND INDEX_NAME = index_name_value
    );

    SET @pc_sql = IF(@pc_index_exists = 0, ddl_value, 'SELECT 1');
    PREPARE pc_stmt FROM @pc_sql;
    EXECUTE pc_stmt;
    DEALLOCATE PREPARE pc_stmt;
END //
DELIMITER ;

CALL pc_add_legal_column('pa_txn_legal_card', 'property_id', 'ALTER TABLE pa_txn_legal_card ADD COLUMN property_id BIGINT NOT NULL DEFAULT 0 AFTER tenant_id');
CALL pc_add_legal_column('pa_txn_legal_card', 'unit_id', 'ALTER TABLE pa_txn_legal_card ADD COLUMN unit_id BIGINT NOT NULL DEFAULT 0 AFTER property_id');
CALL pc_rename_legal_column('pa_txn_legal_card', 'priority_code', 'priority', 'ALTER TABLE pa_txn_legal_card CHANGE COLUMN priority_code priority ENUM(''H'', ''M'', ''L'') NOT NULL DEFAULT ''M''');
CALL pc_rename_legal_column('pa_txn_legal_card', 'created_at', 'created_on', 'ALTER TABLE pa_txn_legal_card CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_legal_column('pa_txn_legal_card', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_legal_card CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');

ALTER TABLE pa_txn_legal_card_attachment MODIFY COLUMN storage_path VARCHAR(500) NULL;
CALL pc_rename_legal_column('pa_txn_legal_card_attachment', 'created_at', 'created_on', 'ALTER TABLE pa_txn_legal_card_attachment CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_legal_column('pa_txn_legal_card_attachment', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_legal_card_attachment CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_legal_column('pa_txn_legal_card_timeline', 'created_at', 'created_on', 'ALTER TABLE pa_txn_legal_card_timeline CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_legal_column('pa_txn_legal_card_timeline', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_legal_card_timeline CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');
CALL pc_add_legal_index('pa_txn_legal_card_timeline', 'idx_pa_txn_legal_card_timeline_card', 'ALTER TABLE pa_txn_legal_card_timeline ADD KEY idx_pa_txn_legal_card_timeline_card (legal_card_id, created_on)');

DROP PROCEDURE IF EXISTS pc_add_legal_column;
DROP PROCEDURE IF EXISTS pc_rename_legal_column;
DROP PROCEDURE IF EXISTS pc_drop_legal_index;
DROP PROCEDURE IF EXISTS pc_add_legal_index;
