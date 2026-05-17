CREATE TABLE IF NOT EXISTS pa_mst_unit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    property_id BIGINT NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    unit_code VARCHAR(100) NOT NULL,
    unit_type VARCHAR(100) NOT NULL,
    bedrooms INT NULL,
    asking_rent DECIMAL(18,2) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'AVAILABLE',
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pa_mst_unit_code (property_id, unit_code),
    KEY idx_pa_mst_unit_status (status, property_id, unit_type)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_lead (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    lead_no VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    mobile_no VARCHAR(60) NOT NULL,
    email VARCHAR(255) NULL,
    source VARCHAR(100) NULL,
    purpose VARCHAR(40) NOT NULL DEFAULT 'RENT',
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    qualification_score INT NULL,
    qualification_notes TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pa_txn_leasing_lead_no (lead_no),
    KEY idx_pa_txn_leasing_lead_company (company_id),
    KEY idx_pa_txn_leasing_lead_status (status, created_at),
    KEY idx_pa_txn_leasing_lead_mobile (mobile_no)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_prospect (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    lead_id BIGINT NOT NULL,
    prospect_no VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    mobile_no VARCHAR(60) NOT NULL,
    email VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_txn_leasing_prospect_company (company_id),
    UNIQUE KEY uq_pa_txn_leasing_prospect_no (prospect_no),
    UNIQUE KEY uq_pa_txn_leasing_prospect_lead (lead_id),
    CONSTRAINT fk_pa_txn_leasing_prospect_lead FOREIGN KEY (lead_id) REFERENCES pa_txn_leasing_lead(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_requirement (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    prospect_id BIGINT NOT NULL,
    property_id BIGINT NULL,
    property_name VARCHAR(255) NULL,
    unit_type VARCHAR(100) NULL,
    bedrooms INT NULL,
    budget_from DECIMAL(18,2) NULL,
    budget_to DECIMAL(18,2) NULL,
    move_in_date DATE NULL,
    notes TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_txn_leasing_req_company (company_id),
    KEY idx_pa_txn_leasing_req_prospect (prospect_id),
    CONSTRAINT fk_pa_txn_leasing_req_prospect FOREIGN KEY (prospect_id) REFERENCES pa_txn_leasing_prospect(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_site_visit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    prospect_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    visit_at DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    notes TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_txn_leasing_visit_company (company_id),
    KEY idx_pa_txn_leasing_visit_prospect (prospect_id, visit_at),
    KEY idx_pa_txn_leasing_visit_unit (unit_id, visit_at),
    CONSTRAINT fk_pa_txn_leasing_visit_prospect FOREIGN KEY (prospect_id) REFERENCES pa_txn_leasing_prospect(id),
    CONSTRAINT fk_pa_txn_leasing_visit_unit FOREIGN KEY (unit_id) REFERENCES pa_mst_unit(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_offer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    prospect_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    offer_no VARCHAR(50) NOT NULL,
    base_amount DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(18,2) NOT NULL,
    special_terms TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    approval_required TINYINT(1) NOT NULL DEFAULT 0,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pa_txn_leasing_offer_no (offer_no),
    KEY idx_pa_txn_leasing_offer_company (company_id),
    KEY idx_pa_txn_leasing_offer_prospect (prospect_id, status),
    KEY idx_pa_txn_leasing_offer_unit (unit_id, status),
    CONSTRAINT fk_pa_txn_leasing_offer_prospect FOREIGN KEY (prospect_id) REFERENCES pa_txn_leasing_prospect(id),
    CONSTRAINT fk_pa_txn_leasing_offer_unit FOREIGN KEY (unit_id) REFERENCES pa_mst_unit(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_negotiation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    offer_id BIGINT NOT NULL,
    proposed_amount DECIMAL(18,2) NOT NULL,
    notes TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_pa_txn_leasing_neg_company (company_id),
    KEY idx_pa_txn_leasing_neg_offer (offer_id, created_at),
    CONSTRAINT fk_pa_txn_leasing_neg_offer FOREIGN KEY (offer_id) REFERENCES pa_txn_leasing_offer(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_reservation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    reservation_no VARCHAR(50) NOT NULL,
    lead_id BIGINT NOT NULL,
    prospect_id BIGINT NOT NULL,
    offer_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    approval_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REQUIRED',
    reservation_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    payment_waived TINYINT(1) NOT NULL DEFAULT 0,
    expires_at DATETIME NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pa_txn_leasing_reservation_no (reservation_no),
    KEY idx_pa_txn_leasing_res_company (company_id),
    KEY idx_pa_txn_leasing_res_unit_status (unit_id, status),
    KEY idx_pa_txn_leasing_res_prospect (prospect_id, status),
    KEY idx_pa_txn_leasing_res_offer (offer_id),
    CONSTRAINT fk_pa_txn_leasing_res_lead FOREIGN KEY (lead_id) REFERENCES pa_txn_leasing_lead(id),
    CONSTRAINT fk_pa_txn_leasing_res_prospect FOREIGN KEY (prospect_id) REFERENCES pa_txn_leasing_prospect(id),
    CONSTRAINT fk_pa_txn_leasing_res_offer FOREIGN KEY (offer_id) REFERENCES pa_txn_leasing_offer(id),
    CONSTRAINT fk_pa_txn_leasing_res_unit FOREIGN KEY (unit_id) REFERENCES pa_mst_unit(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_payment_receipt (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT NOT NULL,
    receipt_no VARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    erp_receipt_id BIGINT NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pa_txn_leasing_receipt_no (receipt_no),
    KEY idx_pa_txn_leasing_receipt_res (reservation_id),
    CONSTRAINT fk_pa_txn_leasing_receipt_res FOREIGN KEY (reservation_id) REFERENCES pa_txn_leasing_reservation(id)
);

CREATE TABLE IF NOT EXISTS pa_txn_leasing_status_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT NOT NULL,
    from_status VARCHAR(80) NULL,
    to_status VARCHAR(80) NOT NULL,
    comments TEXT NULL,
    changed_by BIGINT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_pa_txn_leasing_hist_entity (entity_type, entity_id, changed_at)
);
