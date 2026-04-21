# Claude Code Guide

This file defines how Claude should behave in this repo. Read it before doing any work here.

---

## Your job

Turn **CSV files + plain-language business requirements** into **correct SQL queries** for a non-technical user. The user will describe what they want in business terms and iterate with you until the SQL is right.

There is no UI, no app, no backend, no database. Everything here is files and folders.

---

## Core behavior rules

1. **Interpret business intent, not literal wording.** The user is non-technical. "Customers who don't have this product" may mean "no row with product X" or "no related record anywhere for product X" — clarify when it matters, and capture the chosen interpretation in the requirement's iteration notes.

2. **Use the Qollabi schema as the source of truth.** The schema lives under `schema/qollabi-schema/`. When CSV column names don't match schema names, reconcile them and note the mapping in the business requirement file.

   - **Ask which source system the CSV came from** (e.g. Brio, Brokercloud) if it isn't obvious. When the user names a source, use the matching file under [`schema/qollabi-schema/mappings/`](../schema/qollabi-schema/mappings/README.md) as the authoritative column mapping instead of inferring from column names.
   - A single CSV column can legitimately map to multiple Qollabi attributes or entities (duplicate rows in the mapping). Each entity has exactly one External ID, but that ID may be a concatenation of multiple CSV columns — follow the `+` notation in the mapping's `External ID` and `Attribute` cells.
   - **Risk objects and coverages are not yet in the schema dump.** Use the model documented in [`schema/qollabi-schema/mappings/README.md`](../schema/qollabi-schema/mappings/README.md): `Customers → Products → Product risk objects → Product coverages`, with `Risk object types` and `Coverage types` acting as templates (analogous to `Product templates → Products`). When SQL touches these entities, flag in the requirement file that the schema dump doesn't yet contain them.

3. **Treat each CSV as its own "database".** One CSV → one folder under `databases/<database-name>/`, named after the CSV file (without `.csv`).

4. **Keep files organized strictly as described below.** Do not invent new top-level folders. Do not store business requirements or SQL outside their owning database folder.

5. **Maintain continuity across iterations.** When the user refines an existing requirement, update the **same** `.md` file and the **same** `.sql` file. Do not create `-v2`, `-final`, `-new` duplicates.

6. **Use business-oriented file names.** `customers-without-brand-er.md` / `.sql`, not `query1.sql` or `test-final.sql`.

7. **Always produce a result CSV alongside the SQL.** For every business requirement, generate both `sql-results/<database-name>/<same-name>.sql` and `sql-results/<database-name>/<same-name>.csv`. The `.csv` holds the rows the query would return when applied to the source CSV — the practical answer the user can open and review. Regenerate it whenever the SQL changes.

8. **Always produce a mapping report alongside the SQL and CSV.** For every business requirement, generate `sql-results/<database-name>/<same-name>.report.md`. The report explains how CSV columns were mapped to Qollabi entities, what assumptions were made while writing the SQL, and any open doubts the user should weigh in on. Regenerate it whenever the SQL or mapping changes. Use the template in the section below.

9. **SQL executes against a Qollabi-shaped CTE layer, not the raw CSV.** Every `.sql` file has two sections:
   - **Translation layer** at the top: CTEs that reshape the source CSV into Qollabi-named tables (`customers`, `products`, `product_risk_objects`, `product_coverages`, etc.) using the source-system mapping. Derived mechanically from `schema/qollabi-schema/mappings/<source>.csv` and kept canonical at `databases/<database-name>/qollabi-view.sql`. Copy its contents into the top of every requirement's `.sql` so each file is self-contained and executable.
   - **Business logic** below it: the query, written against the Qollabi-shaped CTEs in the same form it would take against a real Qollabi Postgres database.

   This makes the business-logic SQL portable (strip the translation layer and it runs against production Qollabi) while keeping the CSV result executable and grounded in the actual query.

10. **Execute SQL via DuckDB to produce the result CSV.** Do not hand-simulate the query. Run the full `.sql` file (translation + business logic) through DuckDB against the source CSV, and write DuckDB's output to `<same-name>.csv`. This guarantees the `.sql` and `.csv` can't silently disagree. Prefer DuckDB CSV reader options that auto-detect delimiter and encoding. If the business logic uses DuckDB-specific syntax that wouldn't survive a port to Postgres, note it in the mapping report's *Open doubts* section.

11. **The result CSV mirrors the source CSV's dialect.** Match delimiter (`,` vs `;`), decimal separator, quoting style, line endings, and encoding (including BOM) so the user can open it in Excel the same way they opened the source. When in doubt, inspect the source file's bytes before writing the result.

---

## Folder layout

```
databases/
  <database-name>/
    csv-content/            ← original CSV, unchanged
    business-requirements/  ← one .md per requirement
    qollabi-view.sql        ← canonical CSV→Qollabi translation layer (CTEs)
sql-results/
  <database-name>/          ← per requirement: .sql, .csv, .report.md
schema/
  qollabi-schema/           ← authoritative schema + column mappings/
instructions/
  user-guide.md
  claude-code-guide.md       ← this file
```

---

## When a new CSV is uploaded

1. Create `databases/<database-name>/` where `<database-name>` is the CSV filename without its extension.
2. Create `databases/<database-name>/csv-content/` and save the **original** CSV there, unchanged, as a `.csv` file.
3. Create `databases/<database-name>/business-requirements/` (empty at first).
4. Create the matching `sql-results/<database-name>/` folder.
5. **Ask which source system the CSV came from** (Brio, Brokercloud, other) and build `databases/<database-name>/qollabi-view.sql`: a file of DuckDB CTEs that reshape the CSV into Qollabi-named tables, derived mechanically from `schema/qollabi-schema/mappings/<source>.csv`. If no mapping file exists yet for the source system, scaffold `qollabi-view.sql` with placeholder CTEs and flag in the first requirement's report that the translation layer is incomplete.
6. Inspect the source CSV's dialect (delimiter, encoding including BOM, decimal separator, line endings) and record it in the first business requirement's report so every result CSV can mirror it.
7. Do **not** convert the CSV to another format by default. If helper files are useful later, they can be added alongside — the original CSV stays untouched.

---

## When the user states a business requirement

1. Create a new Markdown file under `databases/<database-name>/business-requirements/` using a business-oriented kebab-case name (e.g. `customers-without-brand-er.md`).
2. Populate it with the template below.
3. Create the matching `.sql` file at `sql-results/<database-name>/<same-name>.sql`. Start the file with the header comment block, then paste the current contents of `databases/<database-name>/qollabi-view.sql` as the translation layer, then add the business-logic query against the Qollabi-shaped CTEs.
4. Write the business logic against the Qollabi schema and the user's stated intent. It should read like SQL that could run against a real Qollabi Postgres database — the translation CTEs above it handle the CSV reshaping.
5. Execute the full `.sql` file via DuckDB against the source CSV and write the output to `sql-results/<database-name>/<same-name>.csv`. Mirror the source CSV's dialect (delimiter, encoding, quoting, decimal separator, line endings) so it opens cleanly in Excel. Do not hand-simulate — the CSV is the real query output.
6. Create the matching mapping report at `sql-results/<database-name>/<same-name>.report.md` using the report template below. Capture the actual column-by-column mapping used, every interpretive assumption made when turning business language into SQL, any unresolved doubts the user should confirm, schema/mapping gaps, DuckDB-vs-Postgres dialect caveats, and the sanity metrics (source row count, result row count, key entity counts, and any rows dropped with their reason).

### Business requirement file template

```markdown
# <Title>

## Status
<Active | Draft | Done>

## Database
<database-name>

## Source CSV
databases/<database-name>/csv-content/<file>.csv

## Linked SQL file
sql-results/<database-name>/<same-name>.sql

## Original business requirement
<the user's first phrasing, verbatim or lightly cleaned>

## Latest business requirement
<the current, agreed-on phrasing after any refinements>

## Business rules
- <each rule as a bullet>

## Iteration notes
- <short entries recording what changed and why>
```

### SQL file structure template

```sql
-- SQL result for business requirement: <Title>
-- Database: <database-name>
-- Source CSV: databases/<database-name>/csv-content/<file>.csv
-- Linked requirement file: databases/<database-name>/business-requirements/<same-name>.md
-- Mapping report: sql-results/<database-name>/<same-name>.report.md
-- Execution: DuckDB (see databases/<database-name>/qollabi-view.sql for the canonical translation layer).
-- Update this file as the business requirement evolves.

-- ────────────────────────────────────────────────────────────────────────────
-- Translation layer — CSV → Qollabi-shaped tables
-- (Paste of databases/<database-name>/qollabi-view.sql. Keep in sync.)
-- ────────────────────────────────────────────────────────────────────────────
WITH customers AS (
  SELECT
    "<csv-col>" AS "externalId",
    ...
  FROM read_csv_auto('databases/<database-name>/csv-content/<file>.csv')
),
products AS (
  ...
)
-- , product_risk_objects AS (...), product_coverages AS (...), etc.

-- ────────────────────────────────────────────────────────────────────────────
-- Business logic — written against Qollabi-shaped CTEs above.
-- ────────────────────────────────────────────────────────────────────────────
SELECT ...
FROM customers c
LEFT JOIN products p ON p."customerExternalId" = c."externalId"
WHERE ...;
```

### Mapping report template

```markdown
# Mapping report: <Title>

## Linked files
- Requirement: databases/<database-name>/business-requirements/<same-name>.md
- SQL:         sql-results/<database-name>/<same-name>.sql
- Result CSV:  sql-results/<database-name>/<same-name>.csv
- Source CSV:  databases/<database-name>/csv-content/<file>.csv

## Source system
<Brio | Brokercloud | Unknown — inferred from schema>

## Mapping file used
<schema/qollabi-schema/mappings/<source>.csv | None — no matching mapping, inferred from schema>

## Column mapping applied
| CSV column | Qollabi entity | Attribute | Notes |
| --- | --- | --- | --- |
| <col> | <Entity> | <attribute> | <e.g. "part of composite External ID with X (no separator)", "concatenated with Y using the space option", "unused for this query"> |

## Assumptions made
- <each interpretive choice turned into SQL, e.g. "'customers without product X' was read as 'no row in products with External ID matching X for that customer', not 'no row across related dossiers'">

## Open doubts / things to confirm
- <each unresolved question the user should weigh in on>

## Schema gaps
- <anything the SQL relied on that isn't in the schema dump, e.g. risk_objects / coverages modelled per the mappings README>

## Dialect caveats
- <anything DuckDB-specific that wouldn't port cleanly to Postgres, or "none — pure-standard SQL">

## Sanity metrics
- Source CSV rows: <N>
- Result rows: <M>
- Distinct customers in result: <K> (out of <C> in source)
- Rows filtered out: <N - M> (<reason breakdown, e.g. "12 excluded: missing policy start date; 140 excluded: not a private individual">)
- CSV dialect preserved: <delimiter, encoding, decimal separator, line endings — matches source>
```

---

## When the user iterates

The user will often say things like "this is not correct yet", "narrow it down", "look across all related records", "too broad". When that happens:

1. **Find the existing requirement file** under the active database.
2. **Update `Latest business requirement`** with the refined phrasing.
3. **Add a bullet under `Iteration notes`** describing what changed (e.g. "Initial version was row-based; switched to grouping by dossier to cover related records").
4. **Adjust `Business rules`** to match the new understanding.
5. **Rewrite the business-logic portion of the same `.sql` file.** Keep the header block and the translation-layer CTEs intact; only touch the translation layer if the column mapping itself changed (in which case update `qollabi-view.sql` first and re-paste).
6. **Re-execute the SQL via DuckDB** and overwrite the result `.csv` with the new output — always mirror the source CSV's dialect.
7. **Update the mapping report `.report.md`** so assumptions, doubts, dialect caveats, and sanity metrics all reflect the new SQL. Clear or rewrite entries that no longer apply — don't keep stale assumptions just because they were recorded earlier.
8. **Do not rename the files** unless the user explicitly asks.

Do not create `-v2`, `-final`, `-iteration-3` files. One requirement = one `.md` + one `.sql`.

---

## Anti-patterns to avoid

- Inventing schema fields that aren't in `schema/qollabi-schema/`.
- Storing SQL files or requirement files at the repo root or outside their database folder.
- Creating multiple SQL files for the same requirement.
- Shipping a `.sql` file without its matching result `.csv` and `.report.md`, or letting any of the three drift out of sync.
- Skipping the report because "it's obvious" — if something is truly obvious, write one line and move on, but don't omit the file.
- Writing the business-logic SQL directly against raw CSV columns (`"Polis"`, `"Dossier"`) instead of the Qollabi-shaped CTEs. That couples the query to the source-system CSV shape and defeats portability.
- Hand-simulating the result CSV instead of executing the `.sql` through DuckDB. The `.csv` must be real query output.
- Writing the result CSV in a different dialect than the source (e.g. `,` when the source used `;`). Excel compatibility breaks silently.
- Converting the CSV to a different format "for convenience".
- Using generic names like `query.sql`, `final.sql`, `new-requirement.md`.
- Building any kind of UI, app, backend, API, or database — this is strictly a file-based workflow.

---

## A good default interaction loop

1. User uploads a CSV → create the database folder structure.
2. User describes what they want → create the requirement `.md` + SQL file.
3. User pushes back on the result → update the same `.md` and `.sql`, log the change under iteration notes.
4. Repeat step 3 until the user is satisfied, then set the requirement's `Status` to `Done`.
