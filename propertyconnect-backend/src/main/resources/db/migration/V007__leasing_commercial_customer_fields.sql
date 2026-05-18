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

CALL pc_add_leasing_column('pa_txn_leasing_lead', 'customer_code', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN customer_code VARCHAR(50) NULL AFTER lead_no');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'customer_type', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN customer_type VARCHAR(80) NULL AFTER customer_code');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'trade_license_no', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN trade_license_no VARCHAR(100) NULL AFTER customer_name');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'cr_number', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN cr_number VARCHAR(100) NULL AFTER trade_license_no');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'vat_registration_no', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN vat_registration_no VARCHAR(100) NULL AFTER cr_number');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'contact_person', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN contact_person VARCHAR(255) NULL AFTER vat_registration_no');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'contact_role', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN contact_role VARCHAR(80) NULL AFTER contact_person');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'contact_title', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN contact_title VARCHAR(120) NULL AFTER contact_role');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'phone_no', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN phone_no VARCHAR(60) NULL AFTER mobile_no');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'fax_no', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN fax_no VARCHAR(60) NULL AFTER email');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'address', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN address VARCHAR(500) NULL AFTER fax_no');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'commercial_need', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN commercial_need VARCHAR(255) NULL AFTER purpose');
CALL pc_add_leasing_column('pa_txn_leasing_lead', 'document_notes', 'ALTER TABLE pa_txn_leasing_lead ADD COLUMN document_notes TEXT NULL AFTER commercial_need');

UPDATE pa_txn_leasing_lead
SET customer_code = CONCAT('CU', LPAD(id, 6, '0'))
WHERE customer_code IS NULL;

CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'customer_code', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN customer_code VARCHAR(50) NULL AFTER prospect_no');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'customer_type', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN customer_type VARCHAR(80) NULL AFTER customer_code');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'trade_license_no', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN trade_license_no VARCHAR(100) NULL AFTER customer_name');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'cr_number', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN cr_number VARCHAR(100) NULL AFTER trade_license_no');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'vat_registration_no', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN vat_registration_no VARCHAR(100) NULL AFTER cr_number');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'contact_person', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN contact_person VARCHAR(255) NULL AFTER vat_registration_no');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'contact_role', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN contact_role VARCHAR(80) NULL AFTER contact_person');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'contact_title', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN contact_title VARCHAR(120) NULL AFTER contact_role');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'phone_no', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN phone_no VARCHAR(60) NULL AFTER mobile_no');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'fax_no', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN fax_no VARCHAR(60) NULL AFTER email');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'address', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN address VARCHAR(500) NULL AFTER fax_no');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'source', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN source VARCHAR(100) NULL AFTER address');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'purpose', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN purpose VARCHAR(40) NULL AFTER source');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'commercial_need', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN commercial_need VARCHAR(255) NULL AFTER purpose');
CALL pc_add_leasing_column('pa_txn_leasing_prospect', 'document_notes', 'ALTER TABLE pa_txn_leasing_prospect ADD COLUMN document_notes TEXT NULL AFTER commercial_need');

UPDATE pa_txn_leasing_prospect prospect
JOIN pa_txn_leasing_lead lead ON lead.id = prospect.lead_id
SET prospect.customer_code = lead.customer_code,
    prospect.customer_type = lead.customer_type,
    prospect.trade_license_no = lead.trade_license_no,
    prospect.cr_number = lead.cr_number,
    prospect.vat_registration_no = lead.vat_registration_no,
    prospect.contact_person = lead.contact_person,
    prospect.contact_role = lead.contact_role,
    prospect.contact_title = lead.contact_title,
    prospect.phone_no = lead.phone_no,
    prospect.fax_no = lead.fax_no,
    prospect.address = lead.address,
    prospect.source = lead.source,
    prospect.purpose = lead.purpose,
    prospect.commercial_need = lead.commercial_need,
    prospect.document_notes = lead.document_notes
WHERE prospect.customer_code IS NULL;

SET @pc_lead_customer_code_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_lead'
      AND INDEX_NAME = 'idx_pa_txn_leasing_lead_customer_code'
);

SET @pc_sql = IF(
    @pc_lead_customer_code_index_exists = 0,
    'CREATE INDEX idx_pa_txn_leasing_lead_customer_code ON pa_txn_leasing_lead (company_id, customer_code)',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

SET @pc_lead_commercial_identifier_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pa_txn_leasing_lead'
      AND INDEX_NAME = 'idx_pa_txn_leasing_lead_commercial_ids'
);

SET @pc_sql = IF(
    @pc_lead_commercial_identifier_index_exists = 0,
    'CREATE INDEX idx_pa_txn_leasing_lead_commercial_ids ON pa_txn_leasing_lead (company_id, trade_license_no, cr_number, vat_registration_no)',
    'SELECT 1'
);
PREPARE pc_stmt FROM @pc_sql;
EXECUTE pc_stmt;
DEALLOCATE PREPARE pc_stmt;

DROP PROCEDURE IF EXISTS pc_add_leasing_column;