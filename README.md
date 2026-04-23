# Business-to-Qollabi SQL

This project turns **CSV files** plus **plain-language business requirements** into **SQL queries**.

You speak in business language. Claude translates that into SQL against the Qollabi schema, executes it via **DuckDB** over your CSV (using a per-database translation layer), and writes the results back as a CSV you can open in Excel. There is no UI, no app, no backend, and no database server — everything is organized through files and folders inside this repo.

---

## How it works

Each CSV you upload becomes its own "database" folder. The business question is captured under `business-requirements/`, and the answers (SQL + result + mapping report) live in a matching folder under `sql-results/`.

```
project-root/
  README.md
  schema/
    qollabi-schema/
      README.md
  databases/
    <database-name>/
      csv-content/            ← original CSV, unchanged
      business-requirements/  ← one .md per business question (the question itself)
      qollabi-view.sql        ← CSV → Qollabi translation layer (CREATE OR REPLACE VIEW …)
  sql-results/
    <database-name>/          ← per requirement: .sql, .csv, .report.md
  instructions/
    user-guide.md
    claude-code-guide.md
```

Each database folder contains:

1. `csv-content/` — the original uploaded CSV, stored **unchanged** as a `.csv` file.
2. `business-requirements/` — one Markdown file per business question for that dataset, capturing status, original/latest phrasing, business rules, iteration notes.
3. `qollabi-view.sql` — the canonical CSV → Qollabi translation layer as `CREATE OR REPLACE VIEW` statements. The only file where CSV column names appear. Run first in a DuckDB connection so the requirement SQL can stay pure Qollabi.

The matching `sql-results/<database-name>/` folder contains, **per business question, exactly three** files sharing the same kebab-case base name as the requirement `.md`:

- `<name>.sql` — the business-logic SELECT against the Qollabi-shaped views. No CSV column names, no translation-layer paste. This is what engineering ports to production. The SQL lives **only** in this file.
- `<name>.csv` — the query's result applied to the source CSV. **The answer — open this in Excel.**
- `<name>.report.md` — the column mapping, interpretive assumptions, open doubts, schema gaps, dialect caveats, and sanity metrics. It does not repeat the requirement text (that's in the `.md`) and does not embed the SQL (that's in the `.sql`).

---

## Core relationship

```
Database folder
  → CSV content
  → Business requirement (.md)
  → Qollabi translation layer (qollabi-view.sql)
SQL results folder (one triple per business question)
  → <name>.sql         ← the SQL, only here
  → <name>.csv         ← the answer
  → <name>.report.md   ← mapping, assumptions, metrics
```

Every business question links a single requirement `.md` to a single `.sql` / `.csv` / `.report.md` triple. Four files, one kebab-case base name. No duplicates, no `-v2`, no embedded-SQL copies.

---

## Workflow

1. **Add a CSV.**
2. **Create a database folder** for it under `databases/`, named after the CSV file (without the `.csv` extension).
3. **Put the CSV** inside `databases/<database-name>/csv-content/` — keep the original filename and extension.
4. **Build `qollabi-view.sql`** in the database folder (translation layer, created once per CSV).
5. **Ask a business question.** Claude writes `databases/<database-name>/business-requirements/<name>.md` plus three files into `sql-results/<database-name>/`: `<name>.sql`, `<name>.csv`, `<name>.report.md`.
6. **Iterate** on the same question — Claude updates the same four files rather than creating new ones.

---

## Example

```
databases/
  sve-demo-file/
    csv-content/
      sve-demo-file.csv
    business-requirements/
      customers-without-brand-er.md
    qollabi-view.sql
sql-results/
  sve-demo-file/
    customers-without-brand-er.sql
    customers-without-brand-er.csv
    customers-without-brand-er.report.md
```

---

## Where to go next

- Non-technical users → [`instructions/user-guide.md`](instructions/user-guide.md)
- Claude's behavior rules → [`instructions/claude-code-guide.md`](instructions/claude-code-guide.md)
- Qollabi schema (source of truth for SQL generation) → [`schema/qollabi-schema/README.md`](schema/qollabi-schema/README.md)
