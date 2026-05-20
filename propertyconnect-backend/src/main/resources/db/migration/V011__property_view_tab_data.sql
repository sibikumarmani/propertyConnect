UPDATE pa_mst_block b
JOIN pa_mst_property p ON p.id = b.parent_id
SET b.company_id = p.company_id
WHERE b.company_id IS NULL;

UPDATE pa_mst_floor f
JOIN pa_mst_block b ON b.id = f.parent_id
JOIN pa_mst_property p ON p.id = b.parent_id
SET f.company_id = p.company_id
WHERE f.company_id IS NULL;

UPDATE pa_mst_unit u
JOIN pa_mst_floor f ON f.id = u.parent_id
JOIN pa_mst_block b ON b.id = f.parent_id
JOIN pa_mst_property p ON p.id = b.parent_id
SET u.company_id = p.company_id,
    u.property_id = p.id,
    u.property_name = p.name
WHERE u.company_id IS NULL OR u.property_id IS NULL;

UPDATE pa_mst_amenity a
JOIN pa_mst_property p ON p.id = a.parent_id
SET a.company_id = p.company_id
WHERE a.company_id IS NULL;

CREATE TABLE IF NOT EXISTS pa_txn_property_view_tab_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id BIGINT NOT NULL,
    tab_code VARCHAR(40) NOT NULL,
    row_type VARCHAR(80) NULL,
    row_data JSON NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active_status ENUM('Y','N') NOT NULL DEFAULT 'Y',
    created_by BIGINT NULL,
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    updated_on DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pa_txn_prop_view_context (company_id, property_id, entity_type, entity_id, tab_code, active_status, sort_order),
    KEY idx_pa_txn_prop_view_property (property_id, tab_code),
    CONSTRAINT fk_pa_txn_prop_view_property FOREIGN KEY (property_id) REFERENCES pa_mst_property(id)
);
