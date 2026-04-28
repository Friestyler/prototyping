# Alive customers over 50 with an Auto policy

## Status
Active

## Database
Demo_Merged_Final_2

## Source CSV
databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv

## Linked SQL file
sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.sql

## Original business requirement
I want all customers that are over 50 years and alive with Auto domein.

## Latest business requirement
All customers aged 50 or over **as of the day the query runs**, still alive (no date of death), who hold at least one product whose category sits anywhere in the `Auto` subtree. This query is run daily; the age boundary must always reflect the current date, never a snapshot.

## Business rules
- "Over 50 years" = age **strictly greater than 50** on the run date — exclusive reading per the canonical `phrases."customers over N"` in `schema/qollabi-schema/semantics.yaml`. Implemented as `dateOfBirth < CURRENT_DATE - INTERVAL '50 years'` so the boundary slides forward every day; someone who turns 51 tomorrow is included tomorrow (not today). Customers exactly 50 years old on the run date are excluded.
- "Alive" = `dateOfDeath` is `NULL` (per `phrases."alive customer"`).
- "Auto domein" = at least one linked product whose category is the `Auto` root itself or any descendant of it, at any depth in the category tree.
- **One row per customer** — the answer is a customer list, not a customer-product list. A customer with ten Auto policies appears exactly once.

## Iteration notes
- Initial version: fixed two-level `sub → top` JOIN; read "over 50" as strictly > 50 (`dateOfBirth <= 1976-04-22`).
- Switched the category match to a general-purpose `category_roots` view in the translation layer.
- Adopted the Qollabi engineer's pattern: moved the tree traversal **into the business-logic SQL** as a `WITH RECURSIVE auto_tree` CTE scoped to the Auto subtree, and removed the `category_roots` view from the translation layer (translation layer stays purely CSV→Qollabi shape, no query helpers). Flipped the age boundary to inclusive (`<= 1976-04-23`, "50-plus"). Empirical count unchanged (168) — the Brio tree is 2 levels deep and no customer in this export was born exactly on 1976-04-23.
- Briefly reshaped to `EXISTS`, then reverted to the engineer's `SELECT DISTINCT` + JOIN pattern on user direction — both give the same 168 rows, and the engineer's pattern is the team idiom.
- Replaced the hardcoded age boundary `DATE '1976-04-23'` with `CURRENT_DATE - INTERVAL '50 years'` so the query stays correct across daily runs. Someone who turns 50 tomorrow is correctly excluded today and correctly included tomorrow; someone who turns 50 in three months is excluded on every run until that date. Today's count is unchanged (168) because the boundary on 2026-04-23 resolves to the same value.
- Rewrote in SELECT-first form: the Qollabi app rejects queries that start with `WITH`/`WITH RECURSIVE` ("Invalid query: Only SELECT statements are allowed."). The `auto_tree` recursive CTE now lives inside a parenthesised subquery in the JOIN, so the file starts with `SELECT`. Result count unchanged (168 customers) — only the wrapping changed.
- Flipped the age boundary back to **strict** `<` to match the canonical `phrases."customers over N"` in `semantics.yaml` ("over 50" = age > 50, excludes 50-year-olds). Earlier iteration had landed on inclusive `<=` reading "50-plus" as Dutch convention; we standardised on strict `<` across the project so two requirements that say "over N" can't disagree on inclusivity. Today's count is unchanged (168) — no customer in this export has `dateOfBirth = CURRENT_DATE - INTERVAL '50 years'` exactly — but the predicate is now semantically aligned and will diverge from the prior shape the day a customer turns 50 on the run date.
