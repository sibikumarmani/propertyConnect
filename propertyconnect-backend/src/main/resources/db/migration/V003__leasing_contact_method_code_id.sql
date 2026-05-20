UPDATE pa_txn_leasing_lead
SET preferred_contact_method = NULL
WHERE preferred_contact_method IS NOT NULL
  AND preferred_contact_method NOT REGEXP '^[0-9]+$';

UPDATE pa_txn_leasing_prospect
SET preferred_contact_method = NULL
WHERE preferred_contact_method IS NOT NULL
  AND preferred_contact_method NOT REGEXP '^[0-9]+$';

ALTER TABLE pa_txn_leasing_lead
    MODIFY preferred_contact_method INT NULL;

ALTER TABLE pa_txn_leasing_prospect
    MODIFY preferred_contact_method INT NULL;
