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
-- Polistype anchored inside a specific domein: the recursive CTE seeds on the polistype
-- whose parent is the `Auto` root category. The join to the parent category plus the
-- `parent."parentId" IS NULL` check disambiguates in case the same polistype name ever
-- appears under a different domein. The recursion still descends through any future
-- sub-polistypes below this anchor.

WITH RECURSIVE toerisme_tree AS (
  SELECT sub."id"
  FROM categories sub
  JOIN categories parent ON parent."id" = sub."parentId"
  WHERE sub."name" = 'Toerisme en Zaken, gemengd gebruik'
    AND parent."name" = 'Auto'
    AND parent."parentId" IS NULL
  UNION ALL
  SELECT c."id"
  FROM categories c
  JOIN toerisme_tree t ON c."parentId" = t."id"
)
SELECT DISTINCT
  c."externalId",
  c."firstName",
  c."lastName",
  c."dateOfBirth",
  c."customerType"
FROM customers c
JOIN products p       ON p."customerId" = c."id"
JOIN toerisme_tree t  ON t."id" = p."productCategoryId"
ORDER BY c."externalId";
