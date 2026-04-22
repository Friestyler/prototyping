# Customers over 50 with Auto domain

## Status
Active

## Database
demo-merged-final-2

## Source CSV
databases/demo-merged-final-2/csv-content/demo-merged-final-2.csv

## Linked SQL file
sql-results/demo-merged-final-2/customers-over-50-with-auto.sql

## Original business requirement
I want all customers that are over 50 years with Auto domein.

## Latest business requirement
Return every natural-person customer who is strictly older than 50 years today (2026-04-22) and holds at least one policy in the `Auto` domain. One row per customer.

## Business rules
- Natural persons only (`customerType = 'naturalPerson'`).
- Strictly older than 50 today — `dateOfBirth < 1976-04-22`; someone born on 1976-04-22 is exactly 50 and is excluded.
- Excludes deceased customers (`dateOfDeath IS NULL`).
- Customer counts as Auto if **any** of their products sits under the `Auto` domain (`categories.parentId = 'Auto'`).
- Output one row per customer — deduplicated across policies.

## Iteration notes
- Initial version; user confirmed all three of: "over 50" = strictly > 50, `Auto` = `Domein - Omschrijving = 'Auto'`, one row per customer.
- Confirmed source system = Brio, with `Maatschappij` treated as `Naam maatschappij`.
- Added `email` to the output. Qollabi's `customers` table has no email column, so the translation layer now emits `contacts` + `customer_contacts` views (one contact per Dossier sourced from the CSV `E-mail`), and the business SQL joins through.
- Added `group` as a third `customerType` value (translation for `Groepering van natuurlijke en/of rechtspersonen`). Recorded in `schema/qollabi-schema/code-lists.md`. Flagged as a schema gap: the Qollabi CHECK constraint currently only allows `naturalPerson` / `legalEntity`.
- Deceased customers remain excluded — user-confirmed.
