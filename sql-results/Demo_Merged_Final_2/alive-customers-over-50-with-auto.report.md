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
| Polistype - Omschrijving | categories | name (child); composite `externalId` = `Polistype` + `Domein` with no separator | Child category; its `parentId` is the Domein externalId. |
| Maatschappij | products | insurerId (CSV supplies insurer name per README §2) + part of `products.name` / `product_templates.name|externalId` | Not used by this query. |
| Product Template Name, Product Template ID, E-mail | — | — | Not in the Brio mapping; confirmed ignorable by the user. |

## Assumptions made
- "Over 50 years" read as **strictly greater than 50** as of today (2026-04-23), i.e. `dateOfBirth <= 1976-04-22`. If the user means ≥ 50, shift the boundary to `<= 1976-04-23`.
- "Alive" = `dateOfDeath IS NULL`. No row in the CSV had a future-dated death, so no additional clause was needed.
- "Auto domein" = the **top-level** category name `Auto` (i.e. `Domein - Omschrijving = 'Auto'`). A customer qualifies if they hold **any** Polis whose category rolls up to that domain — one row per customer, not per policy.
- Output = one row per distinct customer; no `ORDER BY` beyond `externalId` for stable reproduction.

## Open doubts / things to confirm
- Age boundary: strictly > 50 vs ≥ 50.

(Note: `products."lifecycleStage"` is intentionally not part of the query. Per user direction, `lifecycleStage` is never a filter dimension in this repo — see `instructions/claude-code-guide.md` rule 11.)

## Schema gaps
- None used by this query. Risk objects / coverages are not touched.

## Dialect caveats
- `dateformat` in `read_csv_auto` is DuckDB-specific; on real Qollabi Postgres `dateOfBirth` / `dateOfDeath` are already `timestamp` columns, so the cast vanishes.
- `products.insurerId` holds the insurer **name** (Brio CSV doesn't supply an ID). On real Postgres a filter on insurer would become a join to the insurers table on `name`. Not used by this query.
- **External-ID join keys.** The business-logic SQL joins on `customerExternalId` / `categoryExternalId`, which exist only in the translation-layer views. Real Qollabi Postgres joins `products.customerId → customers.id` and `products.productCategoryId → categories.id` using internal UUIDs (external IDs are the user-facing identifier, not the FK). Porting this query to production requires rewriting the join keys; the business logic itself is unchanged.

## Sanity metrics
- Source CSV rows: 1413
- Distinct customers (`Dossier`): 374
- Alive customers: 371
- Alive customers over 50: 288
- Customers with at least one `Auto` product: 205
- Result rows: 168
- Rows filtered out: 206 customers (374 − 168): 3 deceased, 83 alive but ≤ 50, 120 alive and over 50 but no Auto product.
- Unrecognized `customerType` values: 0
- CSV dialect preserved: `;` delimiter, CRLF line endings, UTF-8 (no BOM), `dd/MM/yyyy` date format — matches source.
