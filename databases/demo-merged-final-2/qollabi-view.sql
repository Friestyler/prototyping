-- Canonical CSV → Qollabi translation layer for database: demo-merged-final-2
-- Source system: Brio (user-confirmed, with 'Maatschappij' treated as 'Naam maatschappij')
-- Source CSV:    databases/demo-merged-final-2/csv-content/demo-merged-final-2.csv
-- CSV dialect:   delimiter ';', CRLF line endings, UTF-8 (no BOM), date format dd/mm/yyyy
--
-- Execute this file first in a DuckDB connection; afterwards, every
-- sql-results/demo-merged-final-2/*.sql runs as if querying real Qollabi Postgres tables.
--
-- Extra CSV columns not in the Brio mapping: "Product Template Name", "Product Template ID",
-- "E-mail". "E-mail" is surfaced via the `contacts` + `customer_contacts` views below
-- (Qollabi's `customers` table has no email column; customer email lives on `contacts`).
-- "Product Template Name" / "Product Template ID" are still unused.

CREATE OR REPLACE VIEW raw AS
SELECT * FROM read_csv_auto(
  'databases/demo-merged-final-2/csv-content/demo-merged-final-2.csv',
  delim=';',
  header=true,
  dateformat='%d/%m/%Y'
);

CREATE OR REPLACE VIEW customers AS
SELECT DISTINCT ON ("Dossier")
  "Dossier"                       AS "externalId",
  "Naam"                          AS "name",
  "Naam"                          AS "lastName",
  "Voornaam"                      AS "firstName",
  "Geboortedatum"                 AS "dateOfBirth",
  "Overlijdensdatum"              AS "dateOfDeath",
  CASE "Natuurlijk/Rechtsp - Omschrijving"
    WHEN 'Natuurlijk persoon'                                 THEN 'naturalPerson'
    WHEN 'Rechtspersoon'                                      THEN 'legalEntity'
    WHEN 'Groepering van natuurlijke en/of rechtspersonen'    THEN 'group'
    ELSE NULL
  END                             AS "customerType"
FROM raw
WHERE "Dossier" IS NOT NULL;

CREATE OR REPLACE VIEW contacts AS
SELECT DISTINCT ON ("Dossier")
  "Dossier"  AS "externalId",
  "Voornaam" AS "firstName",
  "Naam"     AS "lastName",
  "E-mail"   AS "email"
FROM raw
WHERE "Dossier" IS NOT NULL;

CREATE OR REPLACE VIEW customer_contacts AS
SELECT DISTINCT
  "Dossier" AS "customerExternalId",
  "Dossier" AS "contactExternalId"
FROM raw
WHERE "Dossier" IS NOT NULL;

CREATE OR REPLACE VIEW categories AS
SELECT DISTINCT
  "Polistype - Omschrijving" || "Domein - Omschrijving" AS "externalId",
  "Polistype - Omschrijving"                            AS "name",
  "Domein - Omschrijving"                               AS "parentId"
FROM raw
WHERE "Polistype - Omschrijving" IS NOT NULL
  AND "Domein - Omschrijving"    IS NOT NULL;

CREATE OR REPLACE VIEW products AS
SELECT
  "Polis"                                                                            AS "externalId",
  "Dossier"                                                                          AS "customerExternalId",
  "Polistype - Omschrijving" || "Domein - Omschrijving"                              AS "productCategoryExternalId",
  "Domein - Omschrijving" || ' ' || "Polistype - Omschrijving" || ' ' || "Maatschappij" AS "name",
  "Maatschappij"                                                                     AS "insurerId"
FROM raw
WHERE "Polis" IS NOT NULL;

CREATE OR REPLACE VIEW product_templates AS
SELECT DISTINCT
  "Polistype - Omschrijving" || "Domein - Omschrijving" || "Maatschappij"           AS "externalId",
  "Domein - Omschrijving" || ' ' || "Polistype - Omschrijving" || ' ' || "Maatschappij" AS "name",
  "Maatschappij"                                                                     AS "insurerId"
FROM raw
WHERE "Polistype - Omschrijving" IS NOT NULL
  AND "Domein - Omschrijving"    IS NOT NULL
  AND "Maatschappij"             IS NOT NULL;
