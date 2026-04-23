# Mapping report: Alive customers over 50 with an Auto policy

## Linked files
- Requirement: databases/Demo_Merged_Final_2/business-requirements/alive-customers-over-50-with-auto.md
- SQL:         sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.sql
- Result CSV:  sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.csv
- Source CSV:  databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv
- View layer:  databases/Demo_Merged_Final_2/qollabi-view.sql

## Source system
Brio (confirmed by user). `Maatschappij` replaces Brio's canonical `Naam maatschappij`; extra CSV columns `Product Template Name`, `Product Template ID`, `E-mail` have no target and are ignored.

## Mapping file used
schema/qollabi-schema/mappings/brio.csv

## Column mapping applied
| CSV column | Qollabi entity | Attribute | Notes |
| --- | --- | --- | --- |
| Dossier | customers | externalId | Used to join customers ↔ products via `customerExternalId`. |
| Naam | customers | name / lastName | Same value populates both. |
| Voornaam | customers | firstName | |
| Geboertedatum | customers | dateOfBirth | Parsed as `dd/MM/yyyy`. Drives the age filter. |
| Overlijdensdatum | customers | dateOfDeath | Empty string → `NULL`; drives the alive filter. |
| Natuurlijk/Rechtsp - Omschrijving | customers | customerType | Code-list translation per `code-lists.md`. |
| Polis | products | externalId | |
| Domein - Omschrijving | categories | externalId / name (top-level) + part of `products.categoryExternalId` + part of `products.name` / `product_templates.name|externalId` | Top-level category; `"Auto"` is the filter target. |
| Polistype - Omschrijving | categories | name (child); composite `externalId` = `Polistype` + `Domein` with no separator | Child category; its `parentId` is the Domein `id`. |
| Maatschappij | products | insurerId (CSV supplies insurer name per README §2) + part of `products.name` / `product_templates.name|externalId` | Not used by this query. |
| Product Template Name, Product Template ID, E-mail | — | — | Not in the Brio mapping; confirmed ignorable by the user. |

## Assumptions made
- "Over 50 years" read as **at least 50** on the run date (Dutch "50-plus"). Implemented as `dateOfBirth <= CURRENT_DATE - INTERVAL '50 years'`, so the query is correct every day it runs — someone who hits 50 tomorrow is included tomorrow, not today. **Do not** replace this with a hardcoded date like `DATE '1976-04-23'`; that would silently drift stale.
- "Alive" = `dateOfDeath IS NULL`. No row in the CSV had a future-dated death, so no additional clause was needed.
- **"Auto domein" = the product's category is `Auto` itself or any descendant of `Auto` in the category tree.** Categories in Qollabi form an arbitrary-depth tree; products can attach at any node. The query uses a `WITH RECURSIVE auto_tree` CTE that starts from the root named `Auto` with no parent and expands downward, then joins products against that set. For this CSV the tree is 2 levels deep (Brio's `Domein → Polistype`) so the empirical count matches what a fixed 2-level join would produce; the pattern stays correct for deeper trees.
- Output = one row per customer. Implemented the Qollabi engineer's idiomatic pattern: `SELECT DISTINCT` over `JOIN products`/`JOIN auto_tree`. A customer with ten Auto policies collapses to one result row. `ORDER BY externalId` for stable reproduction.

## Open doubts / things to confirm
- None outstanding.

(Note: `products."lifecycleStage"` is intentionally not part of the query. Per user direction, `lifecycleStage` is never a filter dimension in this repo — see `instructions/claude-code-guide.md` rule 11.)

## Schema gaps
- None used by this query. Risk objects / coverages are not touched.

## Dialect caveats
- `dateformat` in `read_csv_auto` is DuckDB-specific; on real Qollabi Postgres `dateOfBirth` / `dateOfDeath` are already `timestamp` columns, so the cast vanishes.
- `products.insurerId` holds the insurer **name** (Brio CSV doesn't supply an ID). On real Postgres a filter on insurer would become a join to the insurers table on `name`. Not used by this query.
- **Join keys use production FK names (`customerId`, `productCategoryId`, `parentId`), not `externalId`.** The translation-layer views populate `id` on each entity with the same value as `externalId` (a string surrogate for the production UUID), so joins like `p."customerId" = c."id"` work under DuckDB and read identically to production Qollabi SQL. When this data loads into real Qollabi the `id` columns become the system-assigned UUIDs and the FK values are updated accordingly during import — the query itself stays the same.

## Sanity metrics
- Source CSV rows: 1413
- Distinct customers (`Dossier`): 374
- Alive customers: 371
- Alive customers aged ≥ 50: 288
- Customers with at least one `Auto` product: 205
- Result rows: 168
- Rows filtered out: 206 customers (374 − 168): 3 deceased, 83 alive but under 50, 120 alive and ≥ 50 but no Auto product.
- Unrecognized `customerType` values: 0
- CSV dialect preserved: `;` delimiter, CRLF line endings, UTF-8 (no BOM), `dd/MM/yyyy` date format — matches source.
