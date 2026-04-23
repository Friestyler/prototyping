-- Business requirement: Alive customers over 50 with an Auto policy
-- Database: Demo_Merged_Final_2
-- Report:             sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.report.md  (requirement + mapping + assumptions + SQL embed)
-- Translation layer:  databases/Demo_Merged_Final_2/qollabi-view.sql  (run first in the same DuckDB connection)
--
-- This file contains **only Qollabi-shaped SQL** — no CSV column names, no translation-layer CTEs.

SELECT DISTINCT
  c."externalId",
  c."firstName",
  c."lastName",
  c."dateOfBirth",
  c."customerType"
FROM customers c
JOIN products p
  ON p."customerExternalId" = c."externalId"
JOIN categories sub
  ON sub."externalId" = p."categoryExternalId"
JOIN categories top
  ON top."externalId" = sub."parentId"
WHERE c."dateOfDeath" IS NULL
  AND c."dateOfBirth" <= DATE '1976-04-22'
  AND top."name" = 'Auto'
ORDER BY c."externalId";
