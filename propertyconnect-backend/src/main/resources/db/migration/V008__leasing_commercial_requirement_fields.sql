DROP PROCEDURE IF EXISTS pc_add_leasing_column;

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
DELIMITER ;

CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'requirement_level', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN requirement_level VARCHAR(40) NULL AFTER property_name');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'block_name', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN block_name VARCHAR(120) NULL AFTER requirement_level');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'floor_name', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN floor_name VARCHAR(120) NULL AFTER block_name');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'preferred_unit_id', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN preferred_unit_id BIGINT NULL AFTER floor_name');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'area_from', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN area_from DECIMAL(18,2) NULL AFTER bedrooms');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'area_to', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN area_to DECIMAL(18,2) NULL AFTER area_from');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'lease_term_months', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN lease_term_months INT NULL AFTER move_in_date');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'usage_type', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN usage_type VARCHAR(120) NULL AFTER lease_term_months');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'parking_required', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN parking_required TINYINT(1) NULL AFTER usage_type');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'fit_out_required', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN fit_out_required TINYINT(1) NULL AFTER parking_required');
CALL pc_add_leasing_column('pa_txn_leasing_requirement', 'special_requirements', 'ALTER TABLE pa_txn_leasing_requirement ADD COLUMN special_requirements TEXT NULL AFTER fit_out_required');

DROP PROCEDURE IF EXISTS pc_add_leasing_column;
