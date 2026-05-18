CREATE TABLE IF NOT EXISTS pa_txn_legal_card (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    legal_card_no VARCHAR(40) NOT NULL,
    legal_type_id BIGINT NOT NULL,
    current_stage_id BIGINT NOT NULL,
    reason_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    advocate_id BIGINT NULL,
    case_number VARCHAR(80),
    priority ENUM('H', 'M', 'L') NOT NULL DEFAULT 'M',
    document_status_id BIGINT NOT NULL,
    approval_status_id BIGINT NOT NULL,
    document_date DATE NOT NULL,
    due_date DATE NOT NULL,
    due_amount DECIMAL(14, 2) NOT NULL,
    created_by BIGINT DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT DEFAULT NULL,
    updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pa_txn_legal_card_no (legal_card_no),
    KEY idx_pa_txn_legal_card_company (company_id),
    KEY idx_pa_txn_legal_card_doc_date (document_date),
    KEY idx_pa_txn_legal_card_status (document_status_id, approval_status_id),
    KEY idx_pa_txn_legal_card_type (legal_type_id)
);

CREATE TABLE IF NOT EXISTS pa_txn_legal_card_attachment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    legal_card_id BIGINT NOT NULL,
    document_type_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120),
    storage_path VARCHAR(500) NULL,
    created_by BIGINT DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT DEFAULT NULL,
    updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_txn_legal_card_att_card (legal_card_id),
    CONSTRAINT fk_pa_txn_legal_card_att_card FOREIGN KEY (legal_card_id) REFERENCES pa_txn_legal_card(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_legal_card_timeline (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    legal_card_id BIGINT NOT NULL,
    status_id BIGINT NOT NULL,
    step VARCHAR(120) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    remarks VARCHAR(1000),
    created_by BIGINT DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT DEFAULT NULL,
    updated_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_txn_legal_card_timeline_card (legal_card_id, created_on),
    CONSTRAINT fk_pa_txn_legal_card_timeline_card FOREIGN KEY (legal_card_id) REFERENCES pa_txn_legal_card(id)
);
