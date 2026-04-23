# Alive customers over 50 with an Auto policy

## Status
Active

## Linked files
- SQL:        sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.sql
- Result CSV: sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.csv
- Source CSV: databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv
- View layer: databases/Demo_Merged_Final_2/qollabi-view.sql

## Original business requirement
I want all customers that are over 50 years and alive with Auto domein.

## Latest business requirement
All customers who are strictly older than 50 years as of today (2026-04-23), are still alive (no date of death), and hold at least one product in the `Auto` domain category.

## Business rules
- "Over 50 years" = age strictly greater than 50 today → `dateOfBirth <= 1976-04-22`.
- "Alive" = `dateOfDeath` is `NULL`.
- "Auto domein" = at least one linked product whose top-level category name is `Auto`.
- One row per customer (distinct), not one row per Auto policy.

## Iteration notes
- Initial version: direct translation — age, alive, and Auto-product-existence filter on a single query.

## SQL

Same content as the adjacent `.sql` file. Embedded here so readers without a SQL editor can still read the query.

```sql
SELECT DISTINCT
  c."externalId",
  c."firstName",
  c."lastName",
  c."dateOfBirth",
  c."customerType"
FROM customers c
JOIN products p
  ON p."customerExternalId" = c."externalId"
JOIN categories sub
  ON sub."externalId" = p."categoryExternalId"
JOIN categories top
  ON top."externalId" = sub."parentId"
WHERE c."dateOfDeath" IS NULL
  AND c."dateOfBirth" <= DATE '1976-04-22'
  AND top."name" = 'Auto'
ORDER BY c."externalId";
```

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
- Whether customers who held an Auto product in the past but no longer do should still count. This CSV has no product-lifecycle column (`lifecycleStage`, `contractEndDate`, …), so the query currently treats every row as active.

## Schema gaps
- None used by this query. Risk objects / coverages are not touched.

## Dialect caveats
- `dateformat` in `read_csv_auto` is DuckDB-specific; on real Qollabi Postgres `dateOfBirth` / `dateOfDeath` are already `timestamp` columns, so the cast vanishes.
- `products.insurerId` holds the insurer **name** (Brio CSV doesn't supply an ID). On real Postgres a filter on insurer would become a join to the insurers table on `name`. Not used by this query.

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
