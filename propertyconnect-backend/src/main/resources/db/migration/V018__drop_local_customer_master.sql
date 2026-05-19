DROP PROCEDURE IF EXISTS pc_drop_local_customer_foreign_key;

DELIMITER //
CREATE PROCEDURE pc_drop_local_customer_foreign_key(IN table_name_value VARCHAR(80), IN column_name_value VARCHAR(80))
BEGIN
    SET @pc_constraint_name = (
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = column_name_value
          AND REFERENCED_TABLE_NAME = 'pa_mst_customer'
        LIMIT 1
    );

    SET @pc_sql = IF(@pc_constraint_name IS NOT NULL, CONCAT('ALTER TABLE ', table_name_value, ' DROP FOREIGN KEY ', @pc_constraint_name), 'SELECT 1');
    PREPARE pc_stmt FROM @pc_sql;
    EXECUTE pc_stmt;
    DEALLOCATE PREPARE pc_stmt;
END //
DELIMITER ;

CALL pc_drop_local_customer_foreign_key('pa_txn_leasing_lead', 'customer_id');
CALL pc_drop_local_customer_foreign_key('pa_txn_leasing_prospect', 'customer_id');

DROP TABLE IF EXISTS pa_mst_customer;

DROP PROCEDURE IF EXISTS pc_drop_local_customer_foreign_key;
