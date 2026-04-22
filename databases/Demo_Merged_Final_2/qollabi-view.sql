-- Canonical CSV → Qollabi translation layer for database: Demo_Merged_Final_2
-- Source system: Brio (header matches schema/qollabi-schema/mappings/brio.csv)
-- Source CSV:    databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv
-- CSV dialect:   delimiter ';', line endings CRLF, no BOM, UTF-8, dates DD/MM/YYYY.
--
-- Execute this file first in a DuckDB connection; afterwards, every
-- sql-results/Demo_Merged_Final_2/*.sql runs as if it were querying real Qollabi
-- Postgres tables. Business-logic SQL never references CSV column names — all
-- CSV → Qollabi reshaping is contained here.
--
-- Columns present in the CSV but not in brio.csv (E-mail, Product Template Name,
-- Product Template ID) are mapped by inference and flagged in each requirement's report.

CREATE OR REPLACE VIEW raw AS
SELECT *
FROM read_csv_auto(
  'databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv',
  delim=';',
  header=true,
  dateformat='%d/%m/%Y'
);

CREATE OR REPLACE VIEW customers AS
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
  "E-mail"                                                    AS "email"   -- inferred: not in brio.csv
FROM raw
WHERE "Dossier" IS NOT NULL;

CREATE OR REPLACE VIEW categories AS
SELECT DISTINCT
  -- External ID is composite: Polistype + Domein (no separator) per mappings README
  COALESCE("Polistype - Omschrijving", '') || COALESCE("Domein - Omschrijving", '') AS "externalId",
  "Polistype - Omschrijving"                                                        AS "name",
  "Domein - Omschrijving"                                                           AS "parentId"  -- §2: name stored as-is
FROM raw
WHERE "Polistype - Omschrijving" IS NOT NULL
   OR "Domein - Omschrijving"    IS NOT NULL;

CREATE OR REPLACE VIEW product_templates AS
SELECT DISTINCT
  "Product Template ID"   AS "externalId",   -- inferred: not in brio.csv, CSV supplies directly
  "Product Template Name" AS "name"          -- inferred: not in brio.csv, CSV supplies directly
FROM raw
WHERE "Product Template ID" IS NOT NULL;

CREATE OR REPLACE VIEW products AS
SELECT DISTINCT ON ("Polis")
  "Polis"                                                                           AS "externalId",
  "Dossier"                                                                         AS "customerExternalId",
  "Maatschappij"                                                                    AS "insurerId",      -- §2: name stored as-is
  COALESCE("Polistype - Omschrijving", '') || COALESCE("Domein - Omschrijving", '') AS "categoryExternalId",
  "Product Template ID"                                                             AS "productTemplateExternalId",
  -- products.name per mapping: Domein + Polistype + Maatschappij using the space option
  TRIM(
    COALESCE("Domein - Omschrijving", '')      || ' ' ||
    COALESCE("Polistype - Omschrijving", '')   || ' ' ||
    COALESCE("Maatschappij", '')
  )                                                                                 AS "name"
FROM raw
WHERE "Polis" IS NOT NULL;
