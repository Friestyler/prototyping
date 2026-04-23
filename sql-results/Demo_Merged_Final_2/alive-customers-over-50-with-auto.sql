-- Business requirement: Alive customers over 50 with an Auto policy
-- Database: Demo_Merged_Final_2
-- Requirement:        databases/Demo_Merged_Final_2/business-requirements/alive-customers-over-50-with-auto.md  (business question, rules, iteration notes)
-- Mapping report:     sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.report.md  (column mapping, assumptions, metrics)
-- Translation layer:  databases/Demo_Merged_Final_2/qollabi-view.sql  (run first in the same DuckDB connection)
--
-- This file contains **only Qollabi-shaped SQL** — no CSV column names, no translation-layer CTEs.
-- Joins use production FK columns (customerId → customers.id, productCategoryId → categories.id,
-- parentId → categories.id). externalId appears only in the SELECT output.

WITH RECURSIVE auto_tree AS (
  SELECT "id"
  FROM categories
  WHERE "name" = 'Auto' AND "parentId" IS NULL
  UNION ALL
  SELECT c."id"
  FROM categories c
  JOIN auto_tree a ON c."parentId" = a."id"
)
SELECT DISTINCT
  c."externalId",
  c."firstName",
  c."lastName",
  c."dateOfBirth",
  c."customerType"
FROM customers c
JOIN products p   ON p."customerId" = c."id"
JOIN auto_tree a  ON a."id" = p."productCategoryId"
WHERE c."dateOfDeath" IS NULL
  AND c."dateOfBirth" <= CURRENT_DATE - INTERVAL '50 years'
ORDER BY c."externalId";
