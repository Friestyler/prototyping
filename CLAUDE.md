# Project rules

This project turns CSV files + plain-language business requirements into executable SQL.

**Before doing anything in this repo, read [instructions/claude-code-guide.md](instructions/claude-code-guide.md).** It defines the folder layout, the mandatory "CSV upload → scaffold database folder" trigger, the translation-layer rule, and the anti-patterns to avoid.

## Hard rules (summary — the guide is authoritative)

- **Any CSV the user mentions counts as an upload**, even one referenced from outside the repo (e.g. `~/Downloads/...`). Scaffold `databases/<csv-name>/` and `sql-results/<csv-name>/` before answering any business question against it. Never read the CSV ad-hoc and reply from memory.
- **Never hand-simulate a query result.** Every answer ships as four files sharing one kebab-case base name: a requirement `.md` under `databases/<db>/business-requirements/` (the business question), plus the output triple `.sql` / `.csv` / `.report.md` under `sql-results/<db>/`. The CSV is produced by running `qollabi-view.sql` + `<name>.sql` through DuckDB in a single connection.
- **SQL lives only in `<name>.sql`.** Do not embed it in `.report.md`, in the requirement `.md`, or in any other document. The report covers the mapping + assumptions + metrics; the requirement `.md` covers the business question. If a reader wants to see the SQL they open the `.sql` file.
- **Requirement text lives only in `business-requirements/<name>.md`.** Status, original/latest phrasing, business rules, and iteration notes go there — not duplicated in `.report.md`.
- **Translation layer and business logic live in separate files.** `databases/<db>/qollabi-view.sql` holds `CREATE OR REPLACE VIEW` statements — the only place CSV column names appear. `sql-results/<db>/<name>.sql` contains only the business-logic SELECT against Qollabi-shaped views. Never paste the view file into a requirement `.sql`.
- **Ask for the source system** (Brio, Brokercloud, …) before building `qollabi-view.sql` unless the CSV header unambiguously matches an existing mapping under `schema/qollabi-schema/mappings/`. Record the choice in the first requirement's report.
- **One requirement = one `.md` + one `.sql` + one `.csv` + one `.report.md`.** Iterate in place; no `-v2` / `-final` duplicates.

Everything else — templates, translation-layer conventions, address/money/code-list handling, risk-object/coverage model — is in the guide and the schema docs it links to.
