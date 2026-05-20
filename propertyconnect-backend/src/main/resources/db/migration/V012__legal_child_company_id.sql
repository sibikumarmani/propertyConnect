ALTER TABLE pa_txn_legal_card_attachment
    ADD COLUMN company_id BIGINT NULL AFTER id;

UPDATE pa_txn_legal_card_attachment attachment
JOIN pa_txn_legal_card card ON card.id = attachment.legal_card_id
SET attachment.company_id = card.company_id
WHERE attachment.company_id IS NULL;

ALTER TABLE pa_txn_legal_card_attachment
    MODIFY COLUMN company_id BIGINT NOT NULL,
    ADD KEY idx_pa_txn_legal_card_att_company (company_id, legal_card_id);

ALTER TABLE pa_txn_legal_card_timeline
    ADD COLUMN company_id BIGINT NULL AFTER id;

UPDATE pa_txn_legal_card_timeline timeline
JOIN pa_txn_legal_card card ON card.id = timeline.legal_card_id
SET timeline.company_id = card.company_id
WHERE timeline.company_id IS NULL;

ALTER TABLE pa_txn_legal_card_timeline
    MODIFY COLUMN company_id BIGINT NOT NULL,
    ADD KEY idx_pa_txn_legal_card_timeline_company (company_id, legal_card_id, created_on);
