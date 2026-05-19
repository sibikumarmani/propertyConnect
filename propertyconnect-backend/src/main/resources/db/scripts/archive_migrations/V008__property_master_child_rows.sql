CREATE TABLE IF NOT EXISTS pa_mst_property_ownership (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    property_id BIGINT NOT NULL,
    party VARCHAR(255) NOT NULL,
    role VARCHAR(160) NOT NULL,
    share_right VARCHAR(160) NULL,
    reference VARCHAR(255) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_on DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_mst_property_ownership_property (property_id, status, sort_order),
    CONSTRAINT fk_pa_mst_property_ownership_property FOREIGN KEY (property_id) REFERENCES pa_mst_property(id)
);

CREATE TABLE IF NOT EXISTS pa_mst_property_document (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    property_id BIGINT NOT NULL,
    document VARCHAR(255) NOT NULL,
    category VARCHAR(120) NOT NULL,
    reference VARCHAR(255) NOT NULL,
    updated_date VARCHAR(40) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_on DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_mst_property_document_property (property_id, status, sort_order),
    CONSTRAINT fk_pa_mst_property_document_property FOREIGN KEY (property_id) REFERENCES pa_mst_property(id)
);
