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
- [`mappings/`](mappings/README.md) — source-system → Qollabi column mappings (Brio, Brokercloud, …) used to reconcile uploaded CSVs against the schema.
- [`code-lists.md`](code-lists.md) — canonical Qollabi enum values and the CSV-value translations the translation layer applies for code-list columns.

## Rules

- Treat this folder as authoritative for entity and field naming.
- Do not put business requirements or generated SQL here — those live under `databases/` and `sql-results/` respectively.
- If a business requirement requires a schema concept that isn't documented here yet, add a note in the requirement's iteration notes rather than inventing a field.

## Model notes (Qollabi behavior the schema dump doesn't spell out)

Per-table invariants, per-column semantics, and named SQL patterns live in [`semantics.yaml`](semantics.yaml) as structured metadata keyed by table+column name, so it survives `qollabi-schema.sql` regenerations and column adds/renames without rewrites. Read that file before generating SQL against an unfamiliar entity.

Currently codified there:
- `categories` — arbitrary-depth tree via `parentId`; "domein" = root row (`parentId IS NULL`); same `name` column carries every depth's label.
- `products.productCategoryId` — points at any tree depth; resolve via a recursive CTE, never match category `name` directly on the product row.
- `products.lifecycleStage` — flagged `do_not_filter`.
- Patterns: `domein-tree` (canonical "X in domein Y" recursion) and `polistype-inside-domein` (two composed recursions, one per tree level).
