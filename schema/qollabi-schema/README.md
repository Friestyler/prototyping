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

- **Categories form an arbitrary-depth tree.** `categories.parentId` → `categories.id`, and the tree can go any number of levels deep. A product's `productCategoryId` can point to a category at the root, a direct child, a grand-child, or any deeper descendant. Any business requirement expressed against a "top-level domain" must resolve the product's category up to its root ancestor — **never** hard-code a fixed number of levels in the join.

- **"Domein" = the root of the category tree.** When a business requirement (typically phrased in Dutch/Flemish insurance terms) names a *domein* — `Auto`, `Brand`, `Leven en belegging`, `Rechtsbijstand`, `Bijstand`, etc. — it is always referring to the top-level category, the one with `parentId IS NULL`. Sub-level names like `Polistype - Omschrijving` are children of a domein, not the domein itself.

  The canonical way to query by domein is a `WITH RECURSIVE <domein>_tree` CTE **in the business-logic SQL** that collects the subtree rooted at that domein, then joins products against it. Keep the recursion in the requirement `.sql`, not in the translation layer — the translation layer is strictly CSV → Qollabi shape, with no query-specific helpers. Reference pattern:

  ```sql
  WITH RECURSIVE auto_tree AS (
    SELECT "id" FROM categories WHERE "name" = 'Auto' AND "parentId" IS NULL
    UNION ALL
    SELECT c."id" FROM categories c JOIN auto_tree a ON c."parentId" = a."id"
  )
  SELECT ... FROM products p JOIN auto_tree a ON a."id" = p."productCategoryId" ...;
  ```

  Substitute the domein name and the top-level entity into the template for any other domein-scoped query. See `sql-results/Demo_Merged_Final_2/alive-customers-over-50-with-auto.sql` for the full example.
