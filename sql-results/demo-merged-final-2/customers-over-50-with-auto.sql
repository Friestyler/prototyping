-- Business requirement: Customers over 50 with Auto domain
-- Database: demo-merged-final-2
-- Linked requirement:  databases/demo-merged-final-2/business-requirements/customers-over-50-with-auto.md
-- Mapping report:      sql-results/demo-merged-final-2/customers-over-50-with-auto.report.md
-- Translation layer:   databases/demo-merged-final-2/qollabi-view.sql  (run first in the same DuckDB connection)
--
-- This file contains only Qollabi-shaped SQL — no CSV column names, no translation-layer CTEs.

SELECT DISTINCT
  c."externalId",
  c."firstName",
  c."lastName",
  c."dateOfBirth",
  EXTRACT(YEAR FROM AGE(DATE '2026-04-22', c."dateOfBirth")) AS "age",
  ct."email"
FROM customers c
JOIN products p              ON p."customerExternalId"      = c."externalId"
JOIN categories cat          ON cat."externalId"            = p."productCategoryExternalId"
LEFT JOIN customer_contacts cc ON cc."customerExternalId"   = c."externalId"
LEFT JOIN contacts ct        ON ct."externalId"             = cc."contactExternalId"
WHERE cat."parentId"    = 'Auto'
  AND c."customerType"  = 'naturalPerson'
  AND c."dateOfBirth"  IS NOT NULL
  AND c."dateOfBirth"   < DATE '1976-04-22'
  AND c."dateOfDeath"  IS NULL
ORDER BY c."lastName", c."firstName";
