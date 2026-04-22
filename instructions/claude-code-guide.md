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

9. **SQL executes against a Qollabi-shaped view layer, not the raw CSV. Translation layer and business logic live in separate files.**
   - **Translation layer** lives in `databases/<database-name>/qollabi-view.sql` as a file of `CREATE OR REPLACE VIEW` statements (`raw`, `customers`, `products`, `categories`, `product_templates`, `product_risk_objects`, `product_coverages`, etc.). Derived mechanically from `schema/qollabi-schema/mappings/<source>.csv`. This is the **only** place CSV column names appear.
   - **Business logic** lives in `sql-results/<database-name>/<same-name>.sql` and contains nothing but the Qollabi-shaped query. No CSV column references, no translation-layer paste, no CTE clutter.
   - **Together they execute** in a single DuckDB connection: run `qollabi-view.sql` first to materialize the views, then run the requirement's `.sql`. Stripping the view file and running the business-logic `.sql` against a real Qollabi Postgres database (where `customers` / `products` / `categories` are actual tables) is the portability promise.

10. **Execute SQL via DuckDB to produce the result CSV.** Do not hand-simulate the query. In a single DuckDB connection, execute `databases/<database-name>/qollabi-view.sql` first, then `sql-results/<database-name>/<same-name>.sql`, and write the final SELECT's output to `<same-name>.csv`. This guarantees the `.sql` and `.csv` can't silently disagree. If the business logic uses DuckDB-specific syntax that wouldn't survive a port to Postgres, note it in the mapping report's *Dialect caveats* section.

11. **The result CSV mirrors the source CSV's dialect.** Match delimiter (`,` vs `;`), decimal separator, quoting style, line endings, and encoding (including BOM) so the user can open it in Excel the same way they opened the source. When in doubt, inspect the source file's bytes before writing the result.

---

## Folder layout

```
databases/
  <database-name>/
    csv-content/            ← original CSV, unchanged
    business-requirements/  ← one .md per requirement
    qollabi-view.sql        ← canonical CSV→Qollabi translation layer (CREATE OR REPLACE VIEW …)
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

**Any CSV path the user mentions in this repo counts as an upload — even one referenced from outside the project directory** (e.g. `~/Downloads/...`, an `@` file mention, or a drag-and-drop). As soon as the user introduces a CSV, run the scaffolding steps below **before** writing SQL, inspecting data with ad-hoc scripts, or answering any business question. Reading the CSV with pandas/DuckDB/shell and replying from memory — without persisting the database folder, requirement file, SQL, result CSV, and report — is a violation of this workflow, regardless of how simple the question looks.

1. Create `databases/<database-name>/` where `<database-name>` is the CSV filename without its extension.
2. Create `databases/<database-name>/csv-content/` and save the **original** CSV there, unchanged, as a `.csv` file.
3. Create `databases/<database-name>/business-requirements/` (empty at first).
4. Create the matching `sql-results/<database-name>/` folder.
5. **Ask which source system the CSV came from** (Brio, Brokercloud, other) and build `databases/<database-name>/qollabi-view.sql` as a file of `CREATE OR REPLACE VIEW` statements that reshape the CSV into Qollabi-named tables, derived mechanically from `schema/qollabi-schema/mappings/<source>.csv`. The view file is the only place CSV column names should ever appear. If no mapping file exists yet for the source system, scaffold `qollabi-view.sql` with placeholder views and flag in the first requirement's report that the translation layer is incomplete.
6. Inspect the source CSV's dialect (delimiter, encoding including BOM, decimal separator, line endings) and record it in the first business requirement's report so every result CSV can mirror it.
7. Do **not** convert the CSV to another format by default. If helper files are useful later, they can be added alongside — the original CSV stays untouched.

---

## When the user states a business requirement

1. Create a new Markdown file under `databases/<database-name>/business-requirements/` using a business-oriented kebab-case name (e.g. `customers-without-brand-er.md`).
2. Populate it with the template below.
3. Create the matching `.sql` file at `sql-results/<database-name>/<same-name>.sql`. This file contains **only the business-logic SELECT** (plus a short header comment) written against the Qollabi-shaped views. Do **not** paste `qollabi-view.sql` into it. No CSV column names should appear anywhere in this file.
4. Write the business logic against the Qollabi schema and the user's stated intent. It should read like SQL that could run against a real Qollabi Postgres database — the views defined in `qollabi-view.sql` are the only shim. Output columns must use Qollabi attribute names (never CSV aliases like `AS "Dossier"`).
5. Execute via DuckDB by running `databases/<database-name>/qollabi-view.sql` first, then `sql-results/<database-name>/<same-name>.sql`, in the same connection, and write the final SELECT's output to `sql-results/<database-name>/<same-name>.csv`. Mirror the source CSV's dialect (delimiter, encoding, quoting, decimal separator, line endings) so it opens cleanly in Excel. Do not hand-simulate — the CSV is the real query output.
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

### SQL file structure templates

**`databases/<database-name>/qollabi-view.sql`** — translation layer (CSV → Qollabi views). The only file where CSV column names appear.

```sql
-- Canonical CSV → Qollabi translation layer for database: <database-name>
-- Source system: <Brio | Brokercloud | …>
-- Source CSV:    databases/<database-name>/csv-content/<file>.csv
-- CSV dialect:   <delimiter>, <line endings>, <encoding>, <date format>, …
--
-- Execute this file first in a DuckDB connection; afterwards, every
-- sql-results/<database-name>/*.sql runs as if querying real Qollabi Postgres tables.

CREATE OR REPLACE VIEW raw AS
SELECT * FROM read_csv_auto('databases/<database-name>/csv-content/<file>.csv', delim='…', header=true, dateformat='…');

CREATE OR REPLACE VIEW customers AS
SELECT
  "<csv-col>" AS "externalId",
  ...
FROM raw
WHERE "<csv-col>" IS NOT NULL;

CREATE OR REPLACE VIEW products AS
SELECT ... FROM raw WHERE ...;

-- etc. for categories, product_templates, product_risk_objects, product_coverages, …
```

**`sql-results/<database-name>/<same-name>.sql`** — business-logic SELECT. Pure Qollabi, no CSV references.

```sql
-- Business requirement: <Title>
-- Database: <database-name>
-- Linked requirement:  databases/<database-name>/business-requirements/<same-name>.md
-- Mapping report:      sql-results/<database-name>/<same-name>.report.md
-- Translation layer:   databases/<database-name>/qollabi-view.sql  (run first in the same DuckDB connection)
--
-- This file contains **only Qollabi-shaped SQL** — no CSV column names, no translation-layer CTEs.

SELECT
  c."externalId",
  c."firstName",
  c."lastName",
  ...
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
5. **Rewrite the SELECT in the same `sql-results/.../<same-name>.sql` file.** Only touch `databases/<database-name>/qollabi-view.sql` if the column mapping itself changed.
6. **Re-execute** by running `qollabi-view.sql` + `<same-name>.sql` in one DuckDB connection and overwrite the result `.csv` with the new output — always mirror the source CSV's dialect.
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
- Writing the business-logic SQL directly against raw CSV columns (`"Polis"`, `"Dossier"`) instead of the Qollabi-shaped views. That couples the query to the source-system CSV shape and defeats portability.
- **Pasting the translation layer into the requirement `.sql`.** The translation layer lives only in `databases/<database-name>/qollabi-view.sql`. The requirement file must contain the business-logic SELECT and nothing else — no `WITH raw AS (...)`, no `read_csv_auto`, no CSV column references anywhere in the file. Concatenation happens at execution time (run view file first in the same DuckDB connection), not in the file on disk.
- Aliasing the SELECT output back to CSV column names (e.g. `c."externalId" AS "Dossier"`, `c."firstName" AS "Voornaam"`). The final SELECT must emit **Qollabi attribute names** — the query, including its output shape, should port unchanged to a real Qollabi Postgres database. Derived columns (e.g. `age`) are fine as long as they aren't named after CSV columns.
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
