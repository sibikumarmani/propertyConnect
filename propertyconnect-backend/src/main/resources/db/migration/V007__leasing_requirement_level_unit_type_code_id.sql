UPDATE pa_txn_leasing_requirement
SET requirement_level = NULL
WHERE requirement_level IS NOT NULL
  AND requirement_level NOT REGEXP '^[0-9]+$';

UPDATE pa_txn_leasing_requirement
SET unit_type = NULL
WHERE unit_type IS NOT NULL
  AND unit_type NOT REGEXP '^[0-9]+$';

ALTER TABLE pa_txn_leasing_requirement
    MODIFY requirement_level INT NULL,
    MODIFY unit_type INT NULL;
