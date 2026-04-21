# Qollabi Schema

This folder is the **source of truth** for the Qollabi data model when translating business requirements into SQL.

## Purpose

When Claude generates SQL for a business requirement, it must:

- Resolve business-language concepts (customer, product, policy, dossier, etc.) against the definitions in this folder.
- Prefer schema definitions here over any assumptions inferred from a CSV's column names.
- If the CSV's columns don't match the schema, reconcile them: map CSV columns to Qollabi entities where possible, and flag anything that can't be mapped in the business requirement's iteration notes.

## What lives here

Add the Qollabi schema artifacts into this folder as they become available. Typical contents:

- Entity definitions (tables, fields, types).
- Relationship descriptions (how customers relate to dossiers, products, policies, etc.).
- Canonical code lists (product codes, customer types, status values).
- Naming conventions used across the schema.

## Rules

- Treat this folder as authoritative for entity and field naming.
- Do not put business requirements or generated SQL here — those live under `databases/` and `sql-results/` respectively.
- If a business requirement requires a schema concept that isn't documented here yet, add a note in the requirement's iteration notes rather than inventing a field.
