-- Business requirement: Customers over 50 with an Auto-domain policy
-- Database: Demo_Merged_Final_2
-- Linked requirement:  databases/Demo_Merged_Final_2/business-requirements/customers-over-50-with-auto-domain.md
-- Mapping report:      sql-results/Demo_Merged_Final_2/customers-over-50-with-auto-domain.report.md
-- Translation layer:   databases/Demo_Merged_Final_2/qollabi-view.sql  (run first in the same DuckDB connection)
--
-- This file contains **only Qollabi-shaped SQL** — no CSV column names, no translation-layer CTEs.
-- Strip nothing and it runs unchanged against a real Qollabi Postgres database where
-- `customers`, `products`, and `categories` are actual tables instead of DuckDB views.

SELECT
  c."externalId",
  c."firstName",
  c."lastName",
  c."dateOfBirth",
  date_diff('year', c."dateOfBirth", CURRENT_DATE)
    - CASE
        WHEN (MONTH(CURRENT_DATE), DAY(CURRENT_DATE))
             < (MONTH(c."dateOfBirth"), DAY(c."dateOfBirth"))
        THEN 1 ELSE 0
      END                                   AS age,
  c."customerType",
  c."email"
FROM customers c
WHERE c."dateOfBirth" IS NOT NULL
  AND c."dateOfBirth" <= CURRENT_DATE - INTERVAL 50 YEAR
  AND EXISTS (
    SELECT 1
    FROM products p
    JOIN categories cat ON cat."externalId" = p."categoryExternalId"
    WHERE p."customerExternalId" = c."externalId"
      AND cat."parentId" = 'Auto'
  )
ORDER BY c."lastName", c."firstName";
