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

3. **Treat each CSV as its own "database".** One CSV → one folder under `databases/<database-name>/`, named after the CSV file (without `.csv`).

4. **Keep files organized strictly as described below.** Do not invent new top-level folders. Do not store business requirements or SQL outside their owning database folder.

5. **Maintain continuity across iterations.** When the user refines an existing requirement, update the **same** `.md` file and the **same** `.sql` file. Do not create `-v2`, `-final`, `-new` duplicates.

6. **Use business-oriented file names.** `customers-without-brand-er.md` / `.sql`, not `query1.sql` or `test-final.sql`.

---

## Folder layout

```
databases/
  <database-name>/
    csv-content/            ← original CSV, unchanged
    business-requirements/  ← one .md per requirement
sql-results/
  <database-name>/          ← one .sql per requirement
schema/
  qollabi-schema/           ← authoritative schema
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
5. Do **not** convert the CSV to another format by default. If helper files are useful later, they can be added alongside — the original CSV stays untouched.

---

## When the user states a business requirement

1. Create a new Markdown file under `databases/<database-name>/business-requirements/` using a business-oriented kebab-case name (e.g. `customers-without-brand-er.md`).
2. Populate it with the template below.
3. Create the matching `.sql` file at `sql-results/<database-name>/<same-name>.sql`.
4. Write the SQL based on the Qollabi schema and the user's stated intent. Add comments at the top of the SQL file linking it back to the database, CSV, and requirement file.

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

### SQL file header template

```sql
-- SQL result for business requirement: <Title>
-- Database: <database-name>
-- Source CSV: databases/<database-name>/csv-content/<file>.csv
-- Linked requirement file: databases/<database-name>/business-requirements/<same-name>.md
-- Update this file as the business requirement evolves.
```

---

## When the user iterates

The user will often say things like "this is not correct yet", "narrow it down", "look across all related records", "too broad". When that happens:

1. **Find the existing requirement file** under the active database.
2. **Update `Latest business requirement`** with the refined phrasing.
3. **Add a bullet under `Iteration notes`** describing what changed (e.g. "Initial version was row-based; switched to grouping by dossier to cover related records").
4. **Adjust `Business rules`** to match the new understanding.
5. **Rewrite the SQL in the same `.sql` file.** Keep the header comment block intact.
6. **Do not rename the files** unless the user explicitly asks.

Do not create `-v2`, `-final`, `-iteration-3` files. One requirement = one `.md` + one `.sql`.

---

## Anti-patterns to avoid

- Inventing schema fields that aren't in `schema/qollabi-schema/`.
- Storing SQL files or requirement files at the repo root or outside their database folder.
- Creating multiple SQL files for the same requirement.
- Converting the CSV to a different format "for convenience".
- Using generic names like `query.sql`, `final.sql`, `new-requirement.md`.
- Building any kind of UI, app, backend, API, or database — this is strictly a file-based workflow.

---

## A good default interaction loop

1. User uploads a CSV → create the database folder structure.
2. User describes what they want → create the requirement `.md` + SQL file.
3. User pushes back on the result → update the same `.md` and `.sql`, log the change under iteration notes.
4. Repeat step 3 until the user is satisfied, then set the requirement's `Status` to `Done`.
