-- Business requirement: Customers with at least one Toerisme en Zaken, gemengd gebruik polis
-- Database: Demo_Merged_Final_2
-- Requirement:        databases/Demo_Merged_Final_2/business-requirements/customers-with-polistype-toerisme-en-zaken.md
-- Mapping report:     sql-results/Demo_Merged_Final_2/customers-with-polistype-toerisme-en-zaken.report.md
-- Translation layer:  databases/Demo_Merged_Final_2/qollabi-view.sql  (run first in the same DuckDB connection)
--
-- This file contains **only Qollabi-shaped SQL** — no CSV column names, no translation-layer CTEs.
-- Joins use production FK columns (customerId → customers.id, productCategoryId → categories.id,
-- parentId → categories.id). externalId appears only in the SELECT output.
--
-- The query starts with SELECT (not WITH) because the Qollabi app only accepts
-- statements beginning with SELECT. The recursive CTEs live inside a parenthesised
-- subquery in the JOIN — both DuckDB and Postgres support `WITH` in any subquery context.
--
-- Polistype-inside-domein pattern: compose two recursive CTEs, one per tree level.
--   1. `auto_tree`  — the canonical `<domein>_tree`: anchored on the root category
--                     (`name = 'Auto' AND parentId IS NULL`), then walked downward.
--   2. `toerisme_tree` — anchored on the polistype-by-name **within `auto_tree`**, then
--                        walked downward to absorb any future sub-polistypes.
-- A same-named polistype under a different domein cannot leak in: the inner anchor reads
-- only from `auto_tree`. The shape is future-proof for arbitrary tree depth on either level.

SELECT DISTINCT
  c."externalId",
  c."firstName",
  c."lastName",
  c."dateOfBirth",
  c."customerType"
FROM customers c
JOIN products p ON p."customerId" = c."id"
JOIN (
  WITH RECURSIVE auto_tree AS (
    SELECT "id", "name"
    FROM categories
    WHERE "name" = 'Auto' AND "parentId" IS NULL
    UNION ALL
    SELECT c."id", c."name"
    FROM categories c
    JOIN auto_tree a ON c."parentId" = a."id"
  ),
  toerisme_tree AS (
    SELECT "id"
    FROM auto_tree
    WHERE "name" = 'Toerisme en Zaken, gemengd gebruik'
    UNION ALL
    SELECT c."id"
    FROM categories c
    JOIN toerisme_tree t ON c."parentId" = t."id"
  )
  SELECT "id" FROM toerisme_tree
) t ON t."id" = p."productCategoryId"
ORDER BY c."externalId";
