# Claude Code Guide

This file defines how Claude should behave in this repo. Read it before doing any work here.

---

## Your job

Turn **CSV files + plain-language business requirements** into **correct SQL queries** for a non-technical user. The user will describe what they want in business terms and iterate with you until the SQL is right.

There is no UI, no app, no backend, no database. Everything here is files and folders.

---

## Core behavior rules

1. **Interpret business intent, not literal wording.** The user is non-technical. "Customers who don't have this product" may mean "no row with product X" or "no related record anywhere for product X" — clarify when it matters, and capture the chosen interpretation in the requirement's iteration notes.

2. **Use the Qollabi schema as the source of truth.** The schema lives under `schema/qollabi-schema/`. When CSV column names don't match schema names, reconcile them and note the mapping in the requirement's report.

   - **Ask which source system the CSV came from** (e.g. Brio, Brokercloud) if it isn't obvious. When the user names a source, use the matching file under [`schema/qollabi-schema/mappings/`](../schema/qollabi-schema/mappings/README.md) as the authoritative column mapping instead of inferring from column names.
   - A single CSV column can legitimately map to multiple Qollabi attributes or entities (duplicate rows in the mapping). Each entity has exactly one External ID, but that ID may be a concatenation of multiple CSV columns — follow the `+` notation in the mapping's `External ID` and `Attribute` cells.
   - **Risk objects and coverages are not yet in the schema dump.** Use the model documented in [`schema/qollabi-schema/mappings/README.md`](../schema/qollabi-schema/mappings/README.md): `Customers → Products → Product risk objects → Product coverages`, with `Risk object types` and `Coverage types` acting as templates (analogous to `Product templates → Products`). When SQL touches these entities, flag in the requirement file that the schema dump doesn't yet contain them.

3. **Treat each CSV as its own "database".** One CSV → one folder under `databases/<database-name>/`, named after the CSV file (without `.csv`).

4. **Keep files organized strictly as described below.** Do not invent new top-level folders. Do not store business requirements or SQL outside their owning database folder.

5. **Maintain continuity across iterations.** When the user refines an existing requirement, update the **same** requirement `.md`, `.sql`, `.csv`, and `.report.md` — four files sharing one kebab-case base name. Do not create `-v2`, `-final`, `-new` duplicates.

6. **Use business-oriented file names.** `customers-without-brand-er.md` / `.sql` / `.csv` / `.report.md`, not `query1.sql` or `test-final.sql`.

7. **Every business question produces two things: a requirement document and a three-file output triple.**
   - **Requirement document** — `databases/<database-name>/business-requirements/<same-name>.md`. Captures the business question in plain language: status, original phrasing, latest phrasing after iteration, business rules, iteration notes. This is "what did the user actually ask?" — a reusable record separate from the answer.
   - **Output triple** — all under `sql-results/<database-name>/` and sharing the same base name:
     - `<same-name>.sql` — Qollabi-shaped business-logic SELECT (what engineering ports to production). This is the **only** place the SQL lives; do not embed it in the report or anywhere else.
     - `<same-name>.csv` — the answer, produced by executing the SQL through DuckDB. This is the file the user opens in Excel.
     - `<same-name>.report.md` — explains the mapping: how CSV columns were read into Qollabi entities, what interpretive assumptions were made, open doubts, schema gaps, dialect caveats, sanity metrics. It does **not** duplicate the requirement text (those live in the `.md` next door) and does **not** embed the SQL (that lives in the `.sql` file).

   Regenerate the output triple whenever the SQL or mapping changes — never let the four files drift.

8. **SQL executes against a Qollabi-shaped view layer, not the raw CSV. Translation layer and business logic live in separate files.**
   - **Translation layer** lives in `databases/<database-name>/qollabi-view.sql` as a file of `CREATE OR REPLACE VIEW` statements (`raw`, `customers`, `products`, `categories`, `product_templates`, `product_risk_objects`, `product_coverages`, etc.). Derived mechanically from `schema/qollabi-schema/mappings/<source>.csv`. This is the **only** place CSV column names appear.
   - **Business logic** lives in `sql-results/<database-name>/<same-name>.sql` and contains nothing but the Qollabi-shaped query. No CSV column references, no translation-layer paste, no CTE clutter.
   - **Together they execute** in a single DuckDB connection: run `qollabi-view.sql` first to materialize the views, then run the requirement's `.sql`. Each view exposes the production column names (`id`, `externalId`, `customerId`, `productCategoryId`, `parentId`, …) so the business-logic SQL reads exactly as it would against a real Qollabi Postgres database — see rule 12 for why joins use `id` and not `externalId`.

9. **Execute SQL via DuckDB to produce the result CSV.** Do not hand-simulate the query. In a single DuckDB connection, execute `databases/<database-name>/qollabi-view.sql` first, then `sql-results/<database-name>/<same-name>.sql`, and write the final SELECT's output to `<same-name>.csv`. This guarantees the `.sql` and `.csv` can't silently disagree. If the business logic uses DuckDB-specific syntax that wouldn't survive a port to Postgres, note it in the mapping report's *Dialect caveats* section.

10. **The result CSV mirrors the source CSV's dialect.** Match delimiter (`,` vs `;`), decimal separator, quoting style, line endings, and encoding (including BOM) so the user can open it in Excel the same way they opened the source. When in doubt, inspect the source file's bytes before writing the result.

11. **Never filter on `products."lifecycleStage"` unless the user asks for it explicitly.** User preference: `lifecycleStage` is not a business dimension they query on. Do not add it to any `WHERE` clause, any `EXISTS` subquery, or any sanity-metric breakdown on your own initiative. If a business requirement genuinely needs lifecycle scoping, surface it as an *Open doubt* in the report first and wait for confirmation — don't assume.

12. **"Find customers who …" means one row per customer.** Whatever shape the query takes (JOIN + `SELECT DISTINCT`, or `EXISTS`, or `IN (SELECT …)`), the output must be one row per the entity named in the requirement — never one row per customer-product pair, never duplicated by fan-out. The Qollabi engineer's reference pattern for this codebase uses `SELECT DISTINCT` with JOINs (see `sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.sql`); follow that idiom unless the requirement or the user explicitly asks otherwise. Don't rewrite it to `EXISTS` on your own initiative — both shapes yield the same result and the team's preferred style wins.

13. **"Domein" = the root of the category tree. Always query it with a `WITH RECURSIVE <domein>_tree` CTE.** When a business requirement names a specific domein (e.g. "Auto domein", "Brand", "Leven en belegging", "Rechtsbijstand"), it is always referring to the **top-level** category — the one where `categories."parentId" IS NULL`. Customers/products can be attached to that root directly or anywhere below it in the tree. The canonical query shape:

    ```sql
    WITH RECURSIVE <domein>_tree AS (
      SELECT "id"
      FROM categories
      WHERE "name" = '<Domein Name>' AND "parentId" IS NULL
      UNION ALL
      SELECT c."id"
      FROM categories c
      JOIN <domein>_tree d ON c."parentId" = d."id"
    )
    SELECT DISTINCT <entity columns>
    FROM <entity> e
    JOIN products p        ON p."<entity>Id" = e."id"
    JOIN <domein>_tree d   ON d."id" = p."productCategoryId"
    WHERE <other filters>;
    ```

    Substitute the domein name and the top-level entity (customers, dossiers, etc.) into the template. Do **not** try to filter on `Polistype - Omschrijving` or any subcategory name when the user asked about the domein — the domein is the parent, and sub-matches happen via the recursive walk. Reference query: [`sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.sql`](../sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.sql).

14. **Time-relative filters compute from `CURRENT_DATE`, never from a hardcoded date.** Every query in this repo is designed to run on a schedule (often daily), so any filter based on "today" — age boundaries, "in the last 30 days", "active as of today", etc. — must be expressed relative to the run date:

    ```sql
    c."dateOfBirth" <= CURRENT_DATE - INTERVAL '50 years'         -- yes: boundary slides with the run date
    c."dateOfBirth" <= DATE '1976-04-23'                           -- no: frozen to the day the SQL was written
    ```

    This includes "as of today (…)" phrasings in the requirement — write the rule relative to today in the `.md`, and use `CURRENT_DATE` (or `NOW()`, `CURRENT_TIMESTAMP` as appropriate) in the SQL. Someone whose 50th birthday is tomorrow must be excluded on today's run and included on tomorrow's run; a hardcoded date fails silently on both sides.

    DuckDB and Postgres both understand `CURRENT_DATE - INTERVAL '<n> years'`, `CURRENT_DATE - INTERVAL '<n> days'`, etc. — standard SQL, portable.

15. **Business-logic joins use `id`, not `externalId`.** Every Qollabi entity has an internal `id` (UUID in production, assigned by the system) and an `externalId` (user-facing, present in the CSV, used during import to identify records as unique). Production foreign keys reference `id` — `products.customerId → customers.id`, `products.productCategoryId → categories.id`, `categories.parentId → categories.id`. Business-logic SQL in this repo **must** join via those production FK columns, not via external IDs.

    The CSV carries only externalIds, so the translation-layer views populate `id` with the same value as `externalId` for each entity (a stable string surrogate for the UUID production would assign). Do **not** create synthetic `customerExternalId` / `categoryExternalId` join columns in the views; the column names on each view are exactly the production column names (`id`, `customerId`, `productCategoryId`, `parentId`, `externalId` — the last kept for user-facing SELECT output only).

    Result: the business-logic `.sql` reads identically to SQL you would run against a real Qollabi Postgres database. `externalId` appears only in the SELECT list (the user-facing identifier) and in `WHERE` clauses when the business rule is expressly about external identifiers; it never appears in a `JOIN ... ON` condition.

---

## Folder layout

```
databases/
  <database-name>/
    csv-content/            ← original CSV, unchanged (infrastructure, created once per database)
    business-requirements/  ← one .md per business question (the question itself, plain language)
    qollabi-view.sql        ← canonical CSV→Qollabi translation layer, CREATE OR REPLACE VIEW … (infrastructure, created once per database)
sql-results/
  <database-name>/          ← per requirement: exactly 3 output files — .sql, .csv, .report.md
schema/
  qollabi-schema/           ← authoritative schema + column mappings/
instructions/
  user-guide.md
  claude-code-guide.md       ← this file
```

The **requirement `.md`** (under `databases/<db>/business-requirements/`) holds the business question. The **three output files** (under `sql-results/<db>/`) hold the answer. SQL lives only in `<name>.sql` — never embedded in `.report.md` or elsewhere.

---

## When a new CSV is uploaded

**Any CSV path the user mentions in this repo counts as an upload — even one referenced from outside the project directory** (e.g. `~/Downloads/...`, an `@` file mention, or a drag-and-drop). As soon as the user introduces a CSV, run the scaffolding steps below **before** writing SQL, inspecting data with ad-hoc scripts, or answering any business question. Reading the CSV with pandas/DuckDB/shell and replying from memory — without persisting the database folder, requirement document, SQL, result CSV, and report — is a violation of this workflow, regardless of how simple the question looks.

1. Create `databases/<database-name>/` where `<database-name>` is the CSV filename without its extension.
2. Create `databases/<database-name>/csv-content/` and save the **original** CSV there, unchanged, as a `.csv` file.
3. Create `databases/<database-name>/business-requirements/` (empty at first — one `.md` per business question will land here).
4. Create the matching `sql-results/<database-name>/` folder (empty at first).
5. **Ask which source system the CSV came from** (Brio, Brokercloud, other) and build `databases/<database-name>/qollabi-view.sql` as a file of `CREATE OR REPLACE VIEW` statements that reshape the CSV into Qollabi-named tables, derived mechanically from `schema/qollabi-schema/mappings/<source>.csv`. The view file is the only place CSV column names should ever appear. If no mapping file exists yet for the source system, scaffold `qollabi-view.sql` with placeholder views and flag in the first requirement's report that the translation layer is incomplete.
6. Inspect the source CSV's dialect (delimiter, encoding including BOM, decimal separator, line endings) and record it in the first requirement's report so every result CSV can mirror it.
7. Do **not** convert the CSV to another format by default. If helper files are useful later, they can be added alongside — the original CSV stays untouched.

---

## When the user states a business requirement

Pick a business-oriented kebab-case base name (e.g. `customers-without-brand-er`). All four files share it.

1. Write `databases/<database-name>/business-requirements/<same-name>.md` using the requirement template below. This captures the business question in plain language — what the user asked, the agreed-on interpretation after any back-and-forth, the business rules, and the iteration notes.
2. Write `sql-results/<database-name>/<same-name>.sql` — the business-logic SELECT against the Qollabi-shaped views, plus a short header comment. This file contains **only Qollabi-shaped SQL**: no CSV column names, no `read_csv_auto`, no translation-layer paste. Output columns use Qollabi attribute names (never CSV aliases like `AS "Dossier"`).
3. Execute via DuckDB by running `databases/<database-name>/qollabi-view.sql` first, then `sql-results/<database-name>/<same-name>.sql`, in the same connection, and write the final SELECT's output to `sql-results/<database-name>/<same-name>.csv`. Mirror the source CSV's dialect (delimiter, encoding, quoting, decimal separator, line endings) so it opens cleanly in Excel. Do not hand-simulate — the CSV is the real query output.
4. Write `sql-results/<database-name>/<same-name>.report.md` using the report template below. The report covers **only the mapping and the sanity checks**: column mapping, interpretive assumptions, open doubts, schema/mapping gaps, DuckDB-vs-Postgres dialect caveats, sanity metrics. It does **not** repeat the requirement text (that lives in the `.md` from step 1) and does **not** embed the SQL (that lives in the `.sql` from step 2).

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
--
-- Each view exposes the production column names: `id`, `externalId`, plus FK columns
-- named exactly as in real Qollabi (`customerId`, `productCategoryId`, `parentId`, …).
-- For CSV-backed entities the `id` column is populated with the same value as
-- `externalId` (a stable string surrogate for the UUID production would assign) so
-- business-logic SQL can join via `customerId = id` etc. without a detour through
-- external-id bridges.

CREATE OR REPLACE VIEW raw AS
SELECT * FROM read_csv_auto('databases/<database-name>/csv-content/<file>.csv', delim='…', header=true, dateformat='…');

CREATE OR REPLACE VIEW customers AS
SELECT
  "<csv-col>" AS "id",           -- id := externalId value for CSV-backed DBs
  "<csv-col>" AS "externalId",
  ...
FROM raw
WHERE "<csv-col>" IS NOT NULL;

CREATE OR REPLACE VIEW products AS
SELECT
  "<polis-col>" AS "id",
  "<polis-col>" AS "externalId",
  "<dossier-col>" AS "customerId",           -- FK → customers.id
  "<composite>"   AS "productCategoryId",    -- FK → categories.id
  ...
FROM raw WHERE ...;

-- etc. for categories (with `parentId` FK → categories.id), product_templates,
-- product_risk_objects, product_coverages, …
```

**`sql-results/<database-name>/<same-name>.sql`** — business-logic SELECT. Pure Qollabi, no CSV references.

```sql
-- Business requirement: <Title>
-- Database: <database-name>
-- Requirement:        databases/<database-name>/business-requirements/<same-name>.md  (business question, rules, iteration notes)
-- Mapping report:     sql-results/<database-name>/<same-name>.report.md  (column mapping, assumptions, metrics)
-- Translation layer:  databases/<database-name>/qollabi-view.sql  (run first in the same DuckDB connection)
--
-- This file contains **only Qollabi-shaped SQL** — no CSV column names, no translation-layer CTEs.
-- Joins use production FK columns (customerId → customers.id, productCategoryId →
-- categories.id, parentId → categories.id). externalId appears only in the SELECT list
-- as the user-facing identifier — never in a JOIN ... ON condition.

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

The `.report.md` explains **how** the CSV was mapped to Qollabi and **what was assumed** — nothing more. The business question lives in the requirement `.md`; the SQL lives in the `.sql`; the report does not duplicate either.

```markdown
# Mapping report: <Title>

## Linked files
- Requirement: databases/<database-name>/business-requirements/<same-name>.md
- SQL:         sql-results/<database-name>/<same-name>.sql
- Result CSV:  sql-results/<database-name>/<same-name>.csv
- Source CSV:  databases/<database-name>/csv-content/<file>.csv
- View layer:  databases/<database-name>/qollabi-view.sql

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
- Rows filtered out: <N - M> (<reason breakdown>)
- CSV dialect preserved: <delimiter, encoding, decimal separator, line endings — matches source>
```

---

## When the user iterates

The user will often say things like "this is not correct yet", "narrow it down", "look across all related records", "too broad". When that happens:

1. **Find the existing requirement `.md`** under `databases/<database-name>/business-requirements/`.
2. **Update `Latest business requirement`** with the refined phrasing.
3. **Add a bullet under `Iteration notes`** describing what changed (e.g. "Initial version was row-based; switched to grouping by dossier to cover related records").
4. **Adjust `Business rules`** to match the new understanding.
5. **Rewrite the SELECT in `sql-results/<database-name>/<same-name>.sql`.** Only touch `databases/<database-name>/qollabi-view.sql` if the column mapping itself changed.
6. **Re-execute** by running `qollabi-view.sql` + `<same-name>.sql` in one DuckDB connection and overwrite the result `.csv` with the new output — always mirror the source CSV's dialect.
7. **Update `.report.md`** so mapping, assumptions, doubts, dialect caveats, and sanity metrics reflect the new SQL. Clear or rewrite entries that no longer apply — don't keep stale assumptions just because they were recorded earlier.
8. **Do not rename the files** unless the user explicitly asks.

Do not create `-v2`, `-final`, `-iteration-3` files. One requirement = one `.md` + one `.sql` + one `.csv` + one `.report.md`.

---

## Anti-patterns to avoid

- Inventing schema fields that aren't in `schema/qollabi-schema/`.
- Storing SQL files, requirement files, or reports at the repo root or outside their database folder.
- Creating multiple SQL files for the same requirement.
- Shipping a `.sql` file without its matching result `.csv` and `.report.md`, or letting any of the four files (requirement `.md`, `.sql`, `.csv`, `.report.md`) drift out of sync.
- **Embedding the SQL inside `.report.md`** or any other document. The SQL lives **only** in `<same-name>.sql`. The report explains the mapping and assumptions; it does not repeat the query. If a reader needs to see the SQL, they open the `.sql` file.
- **Duplicating the requirement text inside `.report.md`.** Status, original/latest phrasing, business rules, and iteration notes live only in the requirement `.md` under `business-requirements/`. The report links to it and does not repeat it.
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

1. User uploads a CSV → create `databases/<db>/csv-content/` + `databases/<db>/business-requirements/` + `databases/<db>/qollabi-view.sql` + empty `sql-results/<db>/`.
2. User describes what they want → write the requirement `.md` under `business-requirements/` and the 3-file output triple in `sql-results/<db>/`: `.sql`, executed `.csv`, `.report.md` (mapping + assumptions + metrics only, no SQL embed, no requirement duplication).
3. User pushes back on the result → update the requirement `.md` (Latest phrasing + Iteration notes + Business rules), rewrite the `.sql`, regenerate the `.csv`, update `.report.md`.
4. Repeat step 3 until the user is satisfied, then set the requirement's `Status` to `Done`.
