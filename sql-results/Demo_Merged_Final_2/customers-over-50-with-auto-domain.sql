-- SQL result for business requirement: Customers over 50 with an Auto-domain policy
-- Database: Demo_Merged_Final_2
-- Source CSV: databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv
-- Linked requirement file: databases/Demo_Merged_Final_2/business-requirements/customers-over-50-with-auto-domain.md
-- Mapping report: sql-results/Demo_Merged_Final_2/customers-over-50-with-auto-domain.report.md
-- Execution: DuckDB (see databases/Demo_Merged_Final_2/qollabi-view.sql for the canonical translation layer).
-- Update this file as the business requirement evolves.

-- ────────────────────────────────────────────────────────────────────────────
-- Translation layer — CSV → Qollabi-shaped tables
-- (Paste of databases/Demo_Merged_Final_2/qollabi-view.sql. Keep in sync.)
-- ────────────────────────────────────────────────────────────────────────────
WITH raw AS (
  SELECT *
  FROM read_csv_auto(
    'databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv',
    delim=';',
    header=true,
    dateformat='%d/%m/%Y'
  )
),
customers AS (
  SELECT DISTINCT ON ("Dossier")
    "Dossier"                                                   AS "externalId",
    "Naam"                                                      AS "name",
    "Naam"                                                      AS "lastName",
    "Voornaam"                                                  AS "firstName",
    TRY_CAST("Geboortedatum" AS DATE)                           AS "dateOfBirth",
    TRY_CAST("Overlijdensdatum" AS DATE)                        AS "dateOfDeath",
    CASE "Natuurlijk/Rechtsp - Omschrijving"
      WHEN 'Natuurlijk persoon' THEN 'naturalPerson'
      WHEN 'Rechtspersoon'      THEN 'legalEntity'
      ELSE NULL
    END                                                         AS "customerType",
    "E-mail"                                                    AS "email"
  FROM raw
  WHERE "Dossier" IS NOT NULL
),
categories AS (
  SELECT DISTINCT
    COALESCE("Polistype - Omschrijving", '') || COALESCE("Domein - Omschrijving", '') AS "externalId",
    "Polistype - Omschrijving"                                                        AS "name",
    "Domein - Omschrijving"                                                           AS "parentId"
  FROM raw
  WHERE "Polistype - Omschrijving" IS NOT NULL
     OR "Domein - Omschrijving"    IS NOT NULL
),
product_templates AS (
  SELECT DISTINCT
    "Product Template ID"   AS "externalId",
    "Product Template Name" AS "name"
  FROM raw
  WHERE "Product Template ID" IS NOT NULL
),
products AS (
  SELECT DISTINCT ON ("Polis")
    "Polis"                                                                           AS "externalId",
    "Dossier"                                                                         AS "customerExternalId",
    "Maatschappij"                                                                    AS "insurerId",
    COALESCE("Polistype - Omschrijving", '') || COALESCE("Domein - Omschrijving", '') AS "categoryExternalId",
    "Product Template ID"                                                             AS "productTemplateExternalId",
    TRIM(
      COALESCE("Domein - Omschrijving", '')      || ' ' ||
      COALESCE("Polistype - Omschrijving", '')   || ' ' ||
      COALESCE("Maatschappij", '')
    )                                                                                 AS "name"
  FROM raw
  WHERE "Polis" IS NOT NULL
)

-- ────────────────────────────────────────────────────────────────────────────
-- Business logic — customers aged 50 or older holding at least one Auto-domain policy.
-- ────────────────────────────────────────────────────────────────────────────
SELECT
  c."externalId"   AS "Dossier",
  c."firstName"    AS "Voornaam",
  c."lastName"     AS "Naam",
  c."dateOfBirth"  AS "Geboortedatum",
  date_diff('year', c."dateOfBirth", CURRENT_DATE)
    - CASE
        WHEN (MONTH(CURRENT_DATE), DAY(CURRENT_DATE))
             < (MONTH(c."dateOfBirth"), DAY(c."dateOfBirth"))
        THEN 1 ELSE 0
      END                                   AS "Leeftijd",
  c."customerType" AS "CustomerType",
  c."email"        AS "E-mail"
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
