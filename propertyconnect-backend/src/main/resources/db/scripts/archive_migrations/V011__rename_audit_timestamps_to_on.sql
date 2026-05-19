DROP PROCEDURE IF EXISTS pc_rename_audit_column;

DELIMITER //
CREATE PROCEDURE pc_rename_audit_column(
    IN table_name_value VARCHAR(80),
    IN old_column_name_value VARCHAR(80),
    IN new_column_name_value VARCHAR(80),
    IN ddl_value TEXT
)
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
DELIMITER ;

CALL pc_rename_audit_column('pa_mst_unit', 'created_at', 'created_on', 'ALTER TABLE pa_mst_unit CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_mst_unit', 'updated_at', 'updated_on', 'ALTER TABLE pa_mst_unit CHANGE COLUMN updated_at updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_lead', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_lead CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_leasing_lead', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_leasing_lead CHANGE COLUMN updated_at updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_prospect', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_prospect CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_leasing_prospect', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_leasing_prospect CHANGE COLUMN updated_at updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_requirement', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_requirement CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_leasing_requirement', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_leasing_requirement CHANGE COLUMN updated_at updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_site_visit', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_site_visit CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_leasing_site_visit', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_leasing_site_visit CHANGE COLUMN updated_at updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_offer', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_offer CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_leasing_offer', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_leasing_offer CHANGE COLUMN updated_at updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_negotiation', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_negotiation CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_reservation', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_reservation CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_leasing_reservation', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_leasing_reservation CHANGE COLUMN updated_at updated_on DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_leasing_payment_receipt', 'created_at', 'created_on', 'ALTER TABLE pa_txn_leasing_payment_receipt CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_legal_card', 'created_at', 'created_on', 'ALTER TABLE pa_txn_legal_card CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_legal_card', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_legal_card CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_legal_card_attachment', 'created_at', 'created_on', 'ALTER TABLE pa_txn_legal_card_attachment CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_legal_card_attachment', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_legal_card_attachment CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');

CALL pc_rename_audit_column('pa_txn_legal_card_timeline', 'created_at', 'created_on', 'ALTER TABLE pa_txn_legal_card_timeline CHANGE COLUMN created_at created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL pc_rename_audit_column('pa_txn_legal_card_timeline', 'updated_at', 'updated_on', 'ALTER TABLE pa_txn_legal_card_timeline CHANGE COLUMN updated_at updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP');

DROP PROCEDURE IF EXISTS pc_rename_audit_column;
