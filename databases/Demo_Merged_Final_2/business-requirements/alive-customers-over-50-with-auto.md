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
All customers aged 50 or over as of today (2026-04-23), still alive (no date of death), who hold at least one product whose category sits anywhere in the `Auto` subtree.

## Business rules
- "Over 50 years" = age **at least 50** today (inclusive reading — Dutch "50-plus") → `dateOfBirth <= 1976-04-23`.
- "Alive" = `dateOfDeath` is `NULL`.
- "Auto domein" = at least one linked product whose category is the `Auto` root itself or any descendant of it, at any depth in the category tree.
- One row per customer (distinct), not one row per Auto policy.

## Iteration notes
- Initial version: fixed two-level `sub → top` JOIN; read "over 50" as strictly > 50 (`dateOfBirth <= 1976-04-22`).
- Switched the category match to a general-purpose `category_roots` view in the translation layer.
- Adopted the Qollabi engineer's pattern: moved the tree traversal **into the business-logic SQL** as a `WITH RECURSIVE auto_tree` CTE scoped to the Auto subtree, and removed the `category_roots` view from the translation layer (translation layer stays purely CSV→Qollabi shape, no query helpers). Flipped the age boundary to inclusive (`<= 1976-04-23`, "50-plus"). Empirical count unchanged (168) — the Brio tree is 2 levels deep and no customer in this export was born exactly on 1976-04-23.
