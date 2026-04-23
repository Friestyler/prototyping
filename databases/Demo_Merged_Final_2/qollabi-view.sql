-- Canonical CSV → Qollabi translation layer for database: Demo_Merged_Final_2
-- Source system: Brio (confirmed by user; "Maatschappij" replaces Brio's "Naam maatschappij").
-- Source CSV:    databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv
-- CSV dialect:   delimiter ';', CRLF line endings, UTF-8 (no BOM), date format dd/MM/yyyy.
--
-- Execute this file first in a DuckDB connection; afterwards, every
-- sql-results/Demo_Merged_Final_2/*.sql runs as if querying real Qollabi Postgres tables.
--
-- Columns present in this CSV but not used by the mapping (Product Template Name,
-- Product Template ID, E-mail) are read into `raw` and intentionally ignored
-- by the Qollabi-shaped views — none of them have a target in brio.csv.

CREATE OR REPLACE VIEW raw AS
SELECT *
FROM read_csv_auto(
  'databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv',
  delim=';',
  header=true,
  dateformat='%d/%m/%Y'
);

-- customers: one row per Dossier (a dossier = one customer in Brio).
CREATE OR REPLACE VIEW customers AS
SELECT DISTINCT
  "Dossier"      AS "externalId",
  "Naam"         AS "name",
  "Naam"         AS "lastName",
  "Voornaam"     AS "firstName",
  "Geboortedatum" AS "dateOfBirth",
  "Overlijdensdatum" AS "dateOfDeath",
  CASE "Natuurlijk/Rechtsp - Omschrijving"
    WHEN 'Natuurlijk persoon'                              THEN 'naturalPerson'
    WHEN 'Rechtspersoon'                                   THEN 'legalEntity'
    WHEN 'Groepering van natuurlijke en/of rechtspersonen' THEN 'group'
    ELSE NULL
  END AS "customerType"
FROM raw
WHERE "Dossier" IS NOT NULL;

-- categories: a two-level tree. Parent = Domein, child = Polistype within that Domein.
-- Child external ID is a composite of Polistype + Domein with no separator (per mappings README).
CREATE OR REPLACE VIEW categories AS
SELECT DISTINCT
  "Domein - Omschrijving" AS "externalId",
  "Domein - Omschrijving" AS "name",
  NULL                    AS "parentId"
FROM raw
WHERE "Domein - Omschrijving" IS NOT NULL
UNION
SELECT DISTINCT
  "Polistype - Omschrijving" || "Domein - Omschrijving" AS "externalId",
  "Polistype - Omschrijving"                            AS "name",
  "Domein - Omschrijving"                               AS "parentId"
FROM raw
WHERE "Polistype - Omschrijving" IS NOT NULL
  AND "Domein - Omschrijving"   IS NOT NULL;

-- products: one row per Polis. Each product belongs to a category (child-level),
-- to a customer (via Dossier), and carries its insurer name in "insurerId" per §2.
CREATE OR REPLACE VIEW products AS
SELECT DISTINCT
  "Polis"                                              AS "externalId",
  "Domein - Omschrijving" || ' ' ||
    "Polistype - Omschrijving" || ' ' ||
    "Maatschappij"                                     AS "name",
  "Dossier"                                            AS "customerExternalId",
  "Polistype - Omschrijving" || "Domein - Omschrijving" AS "categoryExternalId",
  "Maatschappij"                                       AS "insurerId"
FROM raw
WHERE "Polis" IS NOT NULL;

-- product_templates: one template per (Domein + Polistype + Maatschappij) combination.
CREATE OR REPLACE VIEW product_templates AS
SELECT DISTINCT
  "Domein - Omschrijving" || "Polistype - Omschrijving" || "Maatschappij" AS "externalId",
  "Domein - Omschrijving" || ' ' ||
    "Polistype - Omschrijving" || ' ' ||
    "Maatschappij"                                                        AS "name"
FROM raw
WHERE "Domein - Omschrijving"   IS NOT NULL
  AND "Polistype - Omschrijving" IS NOT NULL
  AND "Maatschappij"             IS NOT NULL;
