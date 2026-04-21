# User Guide

This guide is for **non-technical users**. You do not need to know SQL or the Qollabi schema to use this repo.

---

## What you do

1. **Upload a CSV.** That CSV becomes its own "database".
2. **Describe what you want in plain business language.** For example:
   - "Find customers missing a product."
   - "Only include private individuals."
   - "Exclude customers who already have the relevant policy."
   - "This should look across all related records, not just one row."
3. **Claude writes the SQL** that answers your request.
4. **If it's not quite right, tell Claude what to change.** You can keep refining the same requirement until the SQL matches what you meant. You don't need to start over — Claude will update the same files.

---

## Where things live

You don't have to manage files by hand, but it helps to know the layout.

Each uploaded CSV gets its own folder under `databases/`, named after the CSV:

```
databases/
  <your-csv-name>/
    csv-content/            ← your original CSV lives here
    business-requirements/  ← one Markdown file per business question you ask
```

The SQL answers live in a matching folder under `sql-results/`:

```
sql-results/
  <your-csv-name>/
    <your-business-requirement>.sql
```

So if you upload `sales-export.csv`, you'll end up with:

- `databases/sales-export/csv-content/sales-export.csv`
- `databases/sales-export/business-requirements/<your-requirement>.md`
- `sql-results/sales-export/<your-requirement>.sql`

---

## How iteration works

You can refine the same business requirement as many times as you need to. When you come back and say "this isn't right, narrow it down", Claude will:

- Update the **same** `.md` file under `business-requirements/` (adding your latest phrasing and a note about what changed).
- Update the **same** `.sql` file under `sql-results/`.

You will **not** end up with `v1`, `v2`, `final-final` files. One requirement = one `.md` + one `.sql`, kept up to date.

---

## Examples of what you can say

- "I want all customers between 50 and 75 who don't have this product."
- "Only include private individuals."
- "Exclude customers who already have this policy."
- "This is not correct yet, it should look across all related records."
- "This is too broad, narrow it down to customers with an active dossier."
- "Find customers missing a product."

You don't have to match column names from the CSV — describe what you mean, and Claude will figure out the mapping using the Qollabi schema.

---

## A few tips

- **One requirement at a time.** Each business question lives in its own `.md` file. Keep them focused ("customers without Brand ER") rather than bundling multiple things into one.
- **Use business-oriented names.** When Claude creates a file for your requirement, it'll name it something like `customers-without-brand-er.md` — readable, not `query-v2.sql`.
- **Say what the answer should look like.** E.g. "I want one row per customer", or "group by dossier" — this helps the SQL land on the first try.
- **Tell Claude when it's wrong.** "That's too broad," "you missed customers who have the product on a related dossier," or "exclude anyone already contacted this month" — plain-language corrections are exactly what this setup is designed for.
