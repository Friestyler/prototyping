# Mapping report: Customers with at least one Toerisme en Zaken, gemengd gebruik polis

## Linked files
- Requirement: databases/Demo_Merged_Final_2/business-requirements/customers-with-polistype-toerisme-en-zaken.md
- SQL:         sql-results/Demo_Merged_Final_2/customers-with-polistype-toerisme-en-zaken.sql
- Result CSV:  sql-results/Demo_Merged_Final_2/customers-with-polistype-toerisme-en-zaken.csv
- Source CSV:  databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv
- View layer:  databases/Demo_Merged_Final_2/qollabi-view.sql

## Source system
Brio (same translation layer as `alive-customers-over-50-with-auto`). `Polistype - Omschrijving` is the child-level `categories.name`, with `parentId` pointing at the parent domein's id.

## Mapping file used
schema/qollabi-schema/mappings/brio.csv

## Column mapping applied
| CSV column | Qollabi entity | Attribute | Notes |
| --- | --- | --- | --- |
| Dossier | customers | externalId / id | Also `products.customerId = customers.id`. |
| Naam | customers | name / lastName | One CSV column → two attributes per Brio mapping. |
| Voornaam | customers | firstName | |
| Geboortedatum | customers | dateOfBirth | Not used by this query's filter; surfaced in the result CSV for readability. |
| Natuurlijk/Rechtsp - Omschrijving | customers | customerType | Not filtered here. |
| Polis | products | externalId / id | |
| Polistype - Omschrijving | categories | name (child-level) | **The filter target.** Anchors the recursive CTE. |
| Polistype - Omschrijving + Domein - Omschrijving | categories | externalId / id (child-level) | Composite id for the child category. Used as `products.productCategoryId`. |
| Domein - Omschrijving | categories | name + id (top-level) + `parentId` of the child | Not filtered here — the polistype is child of `Auto` in this data, but the query doesn't constrain on that parent. |

## Assumptions made
- **"Polistype X inside domein Y" = two composed recursive CTEs.** First `auto_tree` walks the `Auto` root subtree (the canonical `<domein>_tree` pattern). Then `toerisme_tree` anchors on `name = 'Toerisme en Zaken, gemengd gebruik'` **within `auto_tree`** and walks downward. A same-named polistype under a different domein cannot leak in — the inner anchor reads only from `auto_tree`. Both levels are arbitrary-depth-safe.
- **No age / alive / lifecycle filters.** The requirement is a polistype-inside-domein filter and says nothing else.
- Output = one row per customer; `ORDER BY externalId` for stable reproduction.

## Open doubts / things to confirm
- None outstanding.

## Schema gaps
- None used by this query.

## Dialect caveats
- `WITH RECURSIVE` is standard SQL; works identically in DuckDB and real Qollabi Postgres.
- As with every query in this repo, `id` columns in DuckDB carry the CSV's externalId value; in real Postgres they carry the system-assigned UUIDs — the query shape itself is unchanged.

(Note: `products."lifecycleStage"` is intentionally not part of the query per rule 11.)

## Sanity metrics
- Source CSV rows: 1413
- Distinct customers (`Dossier`): 374
- Categories named `Toerisme en Zaken, gemengd gebruik` with parent `Auto` (where `Auto.parentId IS NULL`): 1
- Products attached to that polistype (or any descendant): 234
- Result rows: **190** distinct customers
- Rows filtered out: 184 customers (374 − 190) — they hold no product in this polistype.
- CSV dialect preserved: `;` delimiter, CRLF line endings, UTF-8 (no BOM), `dd/MM/yyyy` date format — matches source.
