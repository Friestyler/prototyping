# Mapping report: Customers over 50 with an Auto-domain policy

## Linked files
- Requirement: databases/Demo_Merged_Final_2/business-requirements/customers-over-50-with-auto-domain.md
- SQL:         sql-results/Demo_Merged_Final_2/customers-over-50-with-auto-domain.sql
- Result CSV:  sql-results/Demo_Merged_Final_2/customers-over-50-with-auto-domain.csv
- Source CSV:  databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv

## Source system
Brio — inferred from the CSV header. Every column except `Product Template Name`, `Product Template ID`, and `E-mail` matches `schema/qollabi-schema/mappings/brio.csv` verbatim; the three extras are consistent with a Brio export enriched with template metadata and contact info.

## Mapping file used
`schema/qollabi-schema/mappings/brio.csv` for every column it covers. The three extras are mapped by inference and called out below.

## Column mapping applied
| CSV column | Qollabi entity | Attribute | Notes |
| --- | --- | --- | --- |
| `Dossier` | customers | externalId | Per brio.csv. Also feeds products.customerExternalId. |
| `Naam` | customers | name + lastName | Per brio.csv — same column feeds both attributes. |
| `Voornaam` | customers | firstName | Per brio.csv. |
| `Geboortedatum` | customers | dateOfBirth | Per brio.csv. Parsed with `dateformat='%d/%m/%Y'`. |
| `Overlijdensdatum` | customers | dateOfDeath | Per brio.csv. Parsed with `dateformat='%d/%m/%Y'`. Not filtered on — see *Assumptions*. |
| `Natuurlijk/Rechtsp - Omschrijving` | customers | customerType | Code-list translation per `schema/qollabi-schema/code-lists.md`. Unknown value `Groepering van natuurlijke en/of rechtspersonen` → `NULL` (see sanity metrics). |
| `E-mail` | customers | email | **Inferred** — not in brio.csv. The Qollabi schema has a `customers.email` column; taking the CSV column verbatim. |
| `Polis` | products | externalId | Per brio.csv. |
| `Domein - Omschrijving` | categories | parentId | Per brio.csv §2: name stored verbatim (no separate ID source). Used for the `Auto` filter. |
| `Domein - Omschrijving` | products / product_templates | name (+ Polistype + Maatschappij, space option) | Per brio.csv. Feeds products.name in the CTE. |
| `Polistype - Omschrijving` | categories | name | Per brio.csv. |
| `Polistype - Omschrijving` | categories | externalId (+ Domein) | Composite External ID, no separator — per mappings README. |
| `Maatschappij` | products | insurerId | Per brio.csv (CSV column `Maatschappij` matches the mapping's `Naam maatschappij` field). §2 applies — name stored verbatim. |
| `Product Template Name` | product_templates | name | **Inferred** — not in brio.csv; CSV provides the template name directly so the CTE sources it as-is instead of deriving from Domein + Polistype + Maatschappij. |
| `Product Template ID` | product_templates | externalId | **Inferred** — not in brio.csv; CSV provides the template ID directly so the CTE uses it as the External ID. Also stored on `products.productTemplateExternalId`. |

Columns from `brio.csv` that are **not present** in this CSV and therefore not materialized: `Situatie - Omschrijving`, `Naam beheerder`, `Rechtsvorm - Omschrijving`, `Laatste termijn totale premie`, `Aanvangsdatum`, `Risico-object type - *`, `Waarborg - *`, all address columns (`Straat`, `Huisnr`, `Bus`, `Land - Omschrijving`, `Postcode`, `Plaats`).

## Assumptions made
- **"Over 50" is read inclusively (age ≥ 50).** Implemented as `dateOfBirth <= CURRENT_DATE - INTERVAL 50 YEAR`. A strict reading (> 50) would drop customers who turn exactly 50 today — currently none in this dataset, so the two readings happen to coincide here, but the rule matters for future runs. See *Open doubts*.
- **Age computed against today's date at query time (`CURRENT_DATE`).** Re-running the SQL tomorrow can therefore shift someone across the 50-year boundary. No reference date was supplied in the requirement.
- **"Auto domein" is read against the category parent**, not a product-name substring. A customer qualifies iff at least one of their products has `categories."parentId" = 'Auto'`. The distinct domain values in the CSV confirm `Auto` is one canonical label (see `distinct domain values` below), so no fuzzy matching was needed.
- **Customers with a non-null `Overlijdensdatum` are kept** (the user didn't ask to exclude them). 0 customers in the final 168 rows have an `Overlijdensdatum` populated — not a load-bearing decision today, but flagged in *Open doubts* in case the user expected them excluded.
- **Customers with `NULL`/unparseable `Geboortedatum` are dropped** (can't compute age). 26 Auto customers fall in this bucket — listed under *Sanity metrics*.
- **The product set is deduplicated on `Polis`** and the customer set on `Dossier`. The source CSV has 1413 rows because a single policy can repeat across multiple risk-object/coverage rows; after dedup there are 374 distinct customers and fewer distinct policies per customer.

## Open doubts / things to confirm
- **Inclusive vs strict "over 50"?** Currently ≥ 50. Flip the `<=` to `<` in the business-logic SQL if the user means > 50 (would change 0 rows on today's data but matters for future reruns).
- **Exclude deceased customers?** Currently kept. None in the result have `Overlijdensdatum`, so no impact today; confirm the rule for future runs.
- **Auto-only customers vs Auto-at-least-one?** Currently "at least one Auto policy." If the user meant "customers whose **only** domein is Auto," the `EXISTS` clause becomes a `NOT EXISTS` for any non-Auto product — roughly ~20–30 fewer rows based on the mix of multi-domain customers.
- **E-mail column mapping.** The CSV's `E-mail` isn't in `brio.csv`; assuming it targets `customers.email`. Confirm and, if correct, add the row to `schema/qollabi-schema/mappings/brio.csv` so future Brio exports don't need the same inference.
- **Customer type `Groepering van natuurlijke en/of rechtspersonen`.** One CSV value falls outside the `naturalPerson`/`legalEntity` enum and is currently translated to `NULL`. Confirm the canonical Qollabi value and add it to `schema/qollabi-schema/code-lists.md`.

## Schema gaps
- **Risk objects and coverages** are not touched by this requirement, so the schema-dump gap flagged in `schema/qollabi-schema/mappings/README.md` has no impact here.
- `customers.email` is not called out in `brio.csv`; inferred from the Qollabi schema. The mapping file should be extended.

## Dialect caveats
- `CURRENT_DATE - INTERVAL 50 YEAR` and `date_diff('year', date, date)` are standard in both DuckDB and Postgres — portable.
- The composite category `externalId` uses string concatenation with `||` — portable.
- The translation layer uses DuckDB's `read_csv_auto` with `dateformat='%d/%m/%Y'`. Stripping the translation layer (when porting the business logic to real Qollabi Postgres) removes this dependency entirely.
- **§2 portability note:** `cat."parentId" = 'Auto'` works because the translation layer stores the domain **name** verbatim in `parentId` per mappings README §2. On real Qollabi Postgres this becomes `JOIN categories parent ON parent.id = cat."parentId" WHERE parent.name = 'Auto'`.
- `DISTINCT ON` is a DuckDB/Postgres extension (not standard SQL) — used in the translation layer for dedup. Portable to Postgres.

## Sanity metrics
- Source CSV rows: **1413**
- Distinct customers in source: **374**
- Customers with ≥1 Auto-domain policy: **205** (307 Auto policy rows in raw CSV)
- Dropped: **26** Auto customers with missing/unparseable `Geboortedatum`
- Dropped: **11** Auto customers under 50 (strict DOB > today − 50y)
- Result rows: **168** (205 − 26 − 11 = 168 ✓)
- Distinct customers in result: **168** (out of 374 in source)
- Unknown `customerType` values mapped to `NULL`: `Groepering van natuurlijke en/of rechtspersonen` (1 distinct raw value, exact row count not computed for this query since it doesn't filter on `customerType`)
- Distinct `Domein - Omschrijving` values in source: `Arbeidsongevallen en collectieve verzekeringen`, `Auto`, `BA andere dan particulieren`, `BA particulieren`, `Bijstand`, `Brand bijzondere risico's`, `Brand eenvoudige risico's`, `Diversen`, `Individueel`, `Leven en belegging`, `Multi-takken`, `Objectieve aansprakelijkheid en van onroerende goederen`, `Rechtsbijstand`, `Reis`, `Transport & marine`
- CSV dialect preserved: delimiter `;`, encoding UTF-8 (no BOM), line endings CRLF, date format `DD/MM/YYYY` — matches source.
- Result CSV header uses **Qollabi attribute names** (`externalId`, `firstName`, `lastName`, `dateOfBirth`, `age`, `customerType`, `email`), not source-CSV names. `age` is a derived, non-schema column.
- Translation layer lives in `databases/Demo_Merged_Final_2/qollabi-view.sql` as `CREATE OR REPLACE VIEW` statements. The requirement `.sql` contains only the Qollabi-shaped business-logic SELECT — no CSV column references, no CTE paste. Execution pattern: run the view file, then the requirement file, in the same DuckDB connection.
