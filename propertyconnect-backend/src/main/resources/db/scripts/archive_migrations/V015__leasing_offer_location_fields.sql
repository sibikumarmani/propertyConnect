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

CALL pc_add_leasing_column('pa_txn_leasing_offer', 'property_id', 'ALTER TABLE pa_txn_leasing_offer ADD COLUMN property_id BIGINT NULL AFTER prospect_id');
CALL pc_add_leasing_column('pa_txn_leasing_offer', 'property_name', 'ALTER TABLE pa_txn_leasing_offer ADD COLUMN property_name VARCHAR(255) NULL AFTER property_id');
CALL pc_add_leasing_column('pa_txn_leasing_offer', 'requirement_level', 'ALTER TABLE pa_txn_leasing_offer ADD COLUMN requirement_level VARCHAR(40) NULL AFTER property_name');
CALL pc_add_leasing_column('pa_txn_leasing_offer', 'block_name', 'ALTER TABLE pa_txn_leasing_offer ADD COLUMN block_name VARCHAR(120) NULL AFTER requirement_level');
CALL pc_add_leasing_column('pa_txn_leasing_offer', 'floor_name', 'ALTER TABLE pa_txn_leasing_offer ADD COLUMN floor_name VARCHAR(120) NULL AFTER block_name');

DROP PROCEDURE IF EXISTS pc_add_leasing_column;

UPDATE pa_txn_leasing_offer offer
JOIN pa_mst_unit unit ON unit.id = offer.unit_id
SET offer.property_id = unit.property_id,
    offer.property_name = unit.property_name,
    offer.requirement_level = 'UNIT'
WHERE offer.property_id IS NULL;

ALTER TABLE pa_txn_leasing_offer
    MODIFY unit_id BIGINT NULL;
