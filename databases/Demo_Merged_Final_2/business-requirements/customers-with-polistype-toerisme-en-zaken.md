# Customers with at least one Toerisme en Zaken, gemengd gebruik polis

## Status
Active

## Database
Demo_Merged_Final_2

## Source CSV
databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv

## Linked SQL file
sql-results/Demo_Merged_Final_2/customers-with-polistype-toerisme-en-zaken.sql

## Original business requirement
Find every customer that has at least one product with polistype `Toerisme en Zaken, gemengd gebruik`.

## Latest business requirement
Every distinct customer who holds at least one product whose category is `Toerisme en Zaken, gemengd gebruik` **specifically as a child of the `Auto` domein**, or any descendant of that polistype if the tree ever goes deeper than two levels. If the same polistype name appeared under a different domein in the workspace, those customers would not qualify.

## Business rules
- "Polistype X inside domein Y" anchors on a category whose `name = 'Toerisme en Zaken, gemengd gebruik'` **and** whose parent is the `Auto` root (`parent.name = 'Auto' AND parent.parentId IS NULL`). A product qualifies if its `productCategoryId` matches that polistype or any descendant of it.
- **One row per customer** — a customer with ten qualifying policies appears exactly once.
- No age, alive, or lifecycle filters — the requirement is polistype-inside-domein only.
- Today's date is irrelevant to the filter — no `CURRENT_DATE` comparison here.

## Iteration notes
- Initial version. Re-used the domein-tree pattern but anchored the recursive CTE on `name = '<polistype>'` only, with no parent constraint. 190 customers.
- Tightened the anchor to `sub.name = 'Toerisme en Zaken, gemengd gebruik' AND parent.name = 'Auto' AND parent.parentId IS NULL` (user-confirmed: the polistype must be under the Auto domein specifically). Empirical count unchanged (190 customers) because the polistype is unique to Auto in this export, but the SQL now disambiguates correctly if a same-named polistype ever appears under another domein.
- Switched to the engineer's recommended composition: two recursive CTEs, one per tree level — `auto_tree` (canonical `<domein>_tree`), then `toerisme_tree` anchored on `name = '<polistype>'` **within `auto_tree`**. Logically equivalent (still 190 customers) but factors the pattern as `domein-tree → polistype-tree`, which is arbitrary-depth-safe on both levels and reads as the natural "X inside Y domein" composition.
- Rewrote in SELECT-first form: the Qollabi app rejects queries that start with `WITH`/`WITH RECURSIVE` ("Invalid query: Only SELECT statements are allowed."). Both `auto_tree` and `toerisme_tree` now live inside a parenthesised subquery in the JOIN, so the file starts with `SELECT`. Result count unchanged (190 customers) — the engine semantics are identical; only the wrapping changed.
