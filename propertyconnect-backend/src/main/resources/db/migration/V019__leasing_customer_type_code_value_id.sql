UPDATE pa_txn_leasing_lead
SET customer_type = NULL
WHERE customer_type IS NOT NULL
  AND customer_type NOT REGEXP '^[0-9]+$';

UPDATE pa_txn_leasing_prospect
SET customer_type = NULL
WHERE customer_type IS NOT NULL
  AND customer_type NOT REGEXP '^[0-9]+$';

ALTER TABLE pa_txn_leasing_lead
	MODIFY COLUMN customer_type INT NULL;

ALTER TABLE pa_txn_leasing_prospect
	MODIFY COLUMN customer_type INT NULL;
