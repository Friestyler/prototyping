# Mapping report: Customers over 50 with Auto domain

## Linked files
- Requirement: databases/demo-merged-final-2/business-requirements/customers-over-50-with-auto.md
- SQL:         sql-results/demo-merged-final-2/customers-over-50-with-auto.sql
- Result CSV:  sql-results/demo-merged-final-2/customers-over-50-with-auto.csv
- Source CSV:  databases/demo-merged-final-2/csv-content/demo-merged-final-2.csv

## Source system
Brio (user-confirmed). User also confirmed that the header `Maatschappij` in this export should be treated as the Brio `Naam maatschappij` column.

## Mapping file used
schema/qollabi-schema/mappings/brio.csv

## Column mapping applied
| CSV column | Qollabi entity | Attribute | Notes |
| --- | --- | --- | --- |
| Dossier | customers | externalId | Primary key per customer. Also used as `products.customerExternalId` link. |
| Naam | customers | name, lastName | One CSV column → two attributes (per Brio mapping). |
| Voornaam | customers | firstName |  |
| Geboortedatum | customers | dateOfBirth | Parsed with `dateformat='%d/%m/%Y'`. |
| Overlijdensdatum | customers | dateOfDeath | Parsed with `dateformat='%d/%m/%Y'`; used to exclude deceased customers. |
| Natuurlijk/Rechtsp - Omschrijving | customers | customerType | Code-list translation (see `schema/qollabi-schema/code-lists.md`). |
| Polis | products | externalId |  |
| Domein - Omschrijving | categories | parentId | Stored as description per mappings README §2. This is the field we filter on (`= 'Auto'`). |
| Polistype - Omschrijving | categories | name |  |
| Polistype - Omschrijving + Domein - Omschrijving | categories | externalId | Composite External ID per Brio mapping (no separator). |
| Maatschappij | products | insurerId | Treated as `Naam maatschappij` per user confirmation. Stored as description per mappings README §2. |
| Maatschappij + Polistype - Omschrijving + Domein - Omschrijving | products | name | Compound with space option per Brio mapping. |
| Product Template Name | — | — | Not in Brio mapping; unused in this query. |
| Product Template ID | — | — | Not in Brio mapping; unused in this query. |
| E-mail | contacts | email | Not in Brio mapping. Qollabi's `customers` table has no `email` column, so the translation layer adds `contacts` (one row per Dossier: externalId / firstName / lastName / email) and `customer_contacts` (join table, `customerExternalId = contactExternalId = Dossier`). Business SQL joins through. |

Relationship columns added by the translation layer that are not literal CSV copies:
- `products.customerExternalId` = `Dossier` — links products back to their customer.
- `products.productCategoryExternalId` = `Polistype - Omschrijving + Domein - Omschrijving` — matches `categories.externalId`, lets business SQL join products to categories without touching CSV columns.

## Assumptions made
- **"Over 50 years" = strictly greater than 50 today (2026-04-22).** Someone born on 1976-04-22 is exactly 50 and is excluded; someone born 1976-04-21 or earlier is included. Encoded as `dateOfBirth < DATE '1976-04-22'`. (User-confirmed.)
- **"Auto domein" = `categories.parentId = 'Auto'`.** The value `Auto` appears in the CSV as a distinct `Domein - Omschrijving`, so no fuzzy matching was needed. (User-confirmed.)
- **One row per customer.** A customer counts as having Auto if any of their policies is in the Auto domain; duplicates collapsed via `SELECT DISTINCT`. (User-confirmed.)
- **Natural persons only.** "Customers" + age filter implies natural persons; legal entities and "Groepering" records are excluded. This matches the sibling requirement `customers-without-brand-er`.
- **Deceased customers excluded** via `dateOfDeath IS NULL` — user-confirmed.
- **`Groepering van natuurlijke en/of rechtspersonen` = `group`** (user-confirmed as a third `customerType` option). 5 customers in this dataset; still filtered out by `= 'naturalPerson'`. The Qollabi CHECK constraint was extended to accept `group` — see `schema/qollabi-schema/qollabi-schema.sql:1301` and `code-lists.md`. Value now round-trips into a real Qollabi database.
- **Email sourced from CSV `E-mail` via a `contacts` view** with a 1-to-1 `customer_contacts` bridge (one contact per customer, externalId = Dossier). Left-joined so customers without an email still appear.
- **Age display column.** `age = EXTRACT(YEAR FROM AGE(...))` — integer years completed. Someone who is 50 years + 1 day shows as `age = 50`; they are included because the filter is on `dateOfBirth`, not on the displayed `age` column.

## Open doubts / things to confirm
- None outstanding. All three open doubts from the first iteration have been resolved (deceased → exclude; email → surfaced via `contacts`; `Groepering…` → `group`).

## Schema gaps
- **`customers.email`** does not exist on the `customers` table. We route email through `contacts` + `customer_contacts`, which is schema-correct — but it synthesizes one contact per customer (externalId = Dossier). A real Brio import would need a separate stream of contact records; the CSV doesn't carry distinct contact identifiers beyond the customer's own email.
- `product_risk_objects` / `product_coverages` / `addresses` are not touched (the CSV has no columns feeding them).

(Previously flagged `customers.customerType` gap for `group` is resolved — the CHECK constraint at `qollabi-schema.sql:1301` now accepts `'naturalPerson' | 'legalEntity' | 'group'`.)

## Dialect caveats
- `AGE(...)` and `EXTRACT(YEAR FROM interval)` both exist in DuckDB and Postgres with equivalent semantics — the age computation ports cleanly.
- `DISTINCT ON (…)` in the `customers` view is Postgres/DuckDB only. When porting to real Qollabi Postgres, drop the view (real `customers` table already has one row per customer) — the business-logic SELECT stays untouched.
- Filtering on `products.insurerId` / `customers.customerType` uses the description value stored in the translation-layer CTE. Per mappings README §2, porting to real Qollabi Postgres turns each such filter into a join to the referenced table + filter on `name`. Not used by this query's WHERE clause, but relevant for any future query that filters on `insurerId`.

## Sanity metrics
- Source CSV rows: 1413 (policy rows) across 374 distinct Dossiers.
- Result rows: 168.
- Distinct customers in result: 168 / 374 (≈ 45%).
- Drop breakdown starting from all 374 customers:
  - 169 excluded: no product in the Auto domain.
  - 26 excluded (of 205 Auto customers): not a natural person — 21 `Rechtspersoon` (→ `legalEntity`) and 5 `Groepering van natuurlijke en/of rechtspersonen` (→ `group`).
  - 11 excluded (of 179 Auto natural persons): aged 50 or under today (including anyone with missing `Geboortedatum`).
  - 0 excluded (of 168 Auto natural persons over 50): deceased customers — none in this dataset.
- Unrecognized `customerType` values encountered: none (all three CSV values now have a translation).
- Result rows missing email: 17 of 168 (≈ 10%) — the source CSV has no `E-mail` value for those customers, not a mapping issue.
- CSV dialect preserved: `;` delimiter, CRLF line endings, UTF-8 (no BOM), `dd/mm/yyyy` dates — matches source.
