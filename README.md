# Business-to-Qollabi SQL

This project turns **CSV files** plus **plain-language business requirements** into **SQL queries**.

You speak in business language. Claude translates that into SQL against the Qollabi schema, executes it via **DuckDB** over your CSV (using a per-database translation layer), and writes the results back as a CSV you can open in Excel. There is no UI, no app, no backend, and no database server — everything is organized through files and folders inside this repo.

---

## How it works

Each CSV you upload becomes its own "database" folder. Business requirements for that dataset live next to the CSV as Markdown files, and the generated SQL lives in a matching folder under `sql-results/`.

```
project-root/
  README.md
  schema/
    qollabi-schema/
      README.md
  databases/
    <database-name>/
      csv-content/
      business-requirements/
  sql-results/
    <database-name>/
  instructions/
    user-guide.md
    claude-code-guide.md
```

Each database folder contains:

1. `csv-content/` — the original uploaded CSV, stored **unchanged** as a `.csv` file.
2. `business-requirements/` — one Markdown file per business requirement for that dataset.
3. `qollabi-view.sql` — the canonical CSV → Qollabi translation layer as `CREATE OR REPLACE VIEW` statements. The only file where CSV column names appear. Run first in a DuckDB connection so the requirement SQL can be pure Qollabi.

The matching `sql-results/<database-name>/` folder contains, for each business requirement, **three** files sharing the same name:

- `<name>.sql` — the business-logic SELECT against the Qollabi-shaped views. No CSV column names, no translation-layer paste.
- `<name>.csv` — the query's result applied to the source CSV.
- `<name>.report.md` — a short report on how the mapping was made, what assumptions were taken, and any open doubts.

---

## Core relationship

```
Database folder
  → CSV content
  → Business requirements
  → SQL results for that database
```

Every business requirement is linked to:

- **One** database
- **One** source CSV
- **One** SQL file
- **One** result CSV (the SQL's output applied to the source CSV)
- **One** mapping report (how the mapping was made, assumptions, and doubts)

Business requirements never live outside their database folder.

---

## Workflow

1. **Add a CSV.**
2. **Create a database folder** for it under `databases/`, named after the CSV file (without the `.csv` extension).
3. **Put the CSV** inside `databases/<database-name>/csv-content/` — keep the original filename and extension.
4. **Add a business requirement** as a Markdown file in `databases/<database-name>/business-requirements/`.
5. **Generate a linked SQL file** in `sql-results/<database-name>/`.
6. **Iterate** on the same requirement until the SQL is correct — update the same `.md` file and the same `.sql` file rather than creating new ones.

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
