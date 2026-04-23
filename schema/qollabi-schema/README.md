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

- **Categories form an arbitrary-depth tree.** `categories.parentId` → `categories.id`, and the tree can go any number of levels deep. A product's `productCategoryId` can point to a category at the root, a direct child, a grand-child, or any deeper descendant. Any business requirement expressed against a "top-level domain" (e.g. "customers with an Auto product") must resolve the product's category up to its root ancestor — **never** hard-code a fixed number of levels in the join. The canonical way to do this in a translation layer is a `category_roots` view defined with `WITH RECURSIVE` that emits `(id, rootId, rootName)` per category, so business-logic SQL can simply `JOIN category_roots cr ON cr.id = p.productCategoryId` and filter on `cr.rootName`. See `databases/Demo_Merged_Final_2/qollabi-view.sql` for the reference implementation.
