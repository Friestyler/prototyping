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
All customers who are strictly older than 50 years as of today (2026-04-23), are still alive (no date of death), and hold at least one product in the `Auto` domain category.

## Business rules
- "Over 50 years" = age strictly greater than 50 today → `dateOfBirth <= 1976-04-22`.
- "Alive" = `dateOfDeath` is `NULL`.
- "Auto domein" = at least one linked product whose top-level category name is `Auto`.
- One row per customer (distinct), not one row per Auto policy.

## Iteration notes
- Initial version: direct translation — age, alive, and Auto-product-existence filter on a single query.
