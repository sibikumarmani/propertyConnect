ALTER TABLE pa_txn_legal_card_attachment
    ADD COLUMN document_name VARCHAR(255) NULL AFTER document_type_id,
    ADD COLUMN content_data LONGTEXT NULL AFTER content_type;
