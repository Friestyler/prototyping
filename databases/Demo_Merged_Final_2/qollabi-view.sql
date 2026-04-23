-- Canonical CSV → Qollabi translation layer for database: Demo_Merged_Final_2
-- Source system: Brio (confirmed by user; "Maatschappij" replaces Brio's "Naam maatschappij").
-- Source CSV:    databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv
-- CSV dialect:   delimiter ';', CRLF line endings, UTF-8 (no BOM), date format dd/MM/yyyy.
--
-- Execute this file first in a DuckDB connection; afterwards, every
-- sql-results/Demo_Merged_Final_2/*.sql runs as if querying real Qollabi Postgres tables.
--
-- id vs externalId
-- ─────────────────
-- Each Qollabi entity has an internal `id` (UUID in production, never in the CSV) and a
-- user-facing `externalId` used during import to identify records. Business-logic SQL
-- joins via the production FK columns (`customerId`, `productCategoryId`, `parentId`)
-- which reference `id`, never `externalId`. For CSV-backed entities we don't have real
-- internal UUIDs, so the views populate `id` with the same value as `externalId`
-- (the Dossier / Polis / category composite key). This keeps the business-logic SQL
-- structurally identical to production Qollabi: `JOIN products p ON p."customerId" =
-- c."id"` — no external-id join bridges, no synthetic `*ExternalId` columns.
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

-- customers: one row per Dossier. id := externalId value for this CSV-backed DB.
CREATE OR REPLACE VIEW customers AS
SELECT DISTINCT
  "Dossier"          AS "id",
  "Dossier"          AS "externalId",
  "Naam"             AS "name",
  "Naam"             AS "lastName",
  "Voornaam"         AS "firstName",
  "Geboortedatum"    AS "dateOfBirth",
  "Overlijdensdatum" AS "dateOfDeath",
  CASE "Natuurlijk/Rechtsp - Omschrijving"
    WHEN 'Natuurlijk persoon'                              THEN 'naturalPerson'
    WHEN 'Rechtspersoon'                                   THEN 'legalEntity'
    WHEN 'Groepering van natuurlijke en/of rechtspersonen' THEN 'group'
    ELSE NULL
  END                AS "customerType"
FROM raw
WHERE "Dossier" IS NOT NULL;

-- categories: two-level tree. Parent = Domein, child = Polistype within that Domein.
-- parentId on the child row is the parent's `id` (real Postgres: FK → categories.id).
CREATE OR REPLACE VIEW categories AS
SELECT DISTINCT
  "Domein - Omschrijving" AS "id",
  "Domein - Omschrijving" AS "externalId",
  "Domein - Omschrijving" AS "name",
  NULL                    AS "parentId"
FROM raw
WHERE "Domein - Omschrijving" IS NOT NULL
UNION
SELECT DISTINCT
  "Polistype - Omschrijving" || "Domein - Omschrijving" AS "id",
  "Polistype - Omschrijving" || "Domein - Omschrijving" AS "externalId",
  "Polistype - Omschrijving"                            AS "name",
  "Domein - Omschrijving"                               AS "parentId"
FROM raw
WHERE "Polistype - Omschrijving" IS NOT NULL
  AND "Domein - Omschrijving"   IS NOT NULL;

-- products: one row per Polis. customerId / productCategoryId mirror the real
-- production FKs into customers.id and categories.id.
CREATE OR REPLACE VIEW products AS
SELECT DISTINCT
  "Polis"                                              AS "id",
  "Polis"                                              AS "externalId",
  "Domein - Omschrijving" || ' ' ||
    "Polistype - Omschrijving" || ' ' ||
    "Maatschappij"                                     AS "name",
  "Dossier"                                            AS "customerId",
  "Polistype - Omschrijving" || "Domein - Omschrijving" AS "productCategoryId",
  "Maatschappij"                                       AS "insurerId"
FROM raw
WHERE "Polis" IS NOT NULL;

-- category_roots: walks the categories tree from each root downward, emitting one
-- row per category carrying the root's id and name. Lets business-logic SQL filter
-- a product by the top-level domain it belongs to regardless of how many levels
-- the category sits below the root. Categories in Qollabi form an arbitrary-depth
-- tree — this CSV happens to be 2 levels (Domein → Polistype) but the query must
-- work for deeper trees too.
CREATE OR REPLACE VIEW category_roots AS
WITH RECURSIVE walker(id, "rootId", "rootName", depth) AS (
  SELECT "id", "id" AS "rootId", "name" AS "rootName", 0
  FROM categories
  WHERE "parentId" IS NULL
  UNION ALL
  SELECT c."id", w."rootId", w."rootName", w.depth + 1
  FROM walker w
  JOIN categories c ON c."parentId" = w."id"
)
SELECT "id", "rootId", "rootName", "depth" FROM walker;

-- product_templates: one template per (Domein + Polistype + Maatschappij) combination.
CREATE OR REPLACE VIEW product_templates AS
SELECT DISTINCT
  "Domein - Omschrijving" || "Polistype - Omschrijving" || "Maatschappij" AS "id",
  "Domein - Omschrijving" || "Polistype - Omschrijving" || "Maatschappij" AS "externalId",
  "Domein - Omschrijving" || ' ' ||
    "Polistype - Omschrijving" || ' ' ||
    "Maatschappij"                                                        AS "name"
FROM raw
WHERE "Domein - Omschrijving"   IS NOT NULL
  AND "Polistype - Omschrijving" IS NOT NULL
  AND "Maatschappij"             IS NOT NULL;
