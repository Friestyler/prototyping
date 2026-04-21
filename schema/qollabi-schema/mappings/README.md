# Column mappings

This folder holds **source-system → Qollabi** column mappings. When the user says their CSV comes from a known source (e.g. "this is a Brio export"), Claude should use the matching mapping file here to translate CSV columns into Qollabi entities and attributes, instead of guessing from column names.

## Available mappings

- [`brio.csv`](brio.csv) — Brio exports.
- `brokercloud.csv` — Brokercloud exports. *(Not yet provided. Add when available.)*

Each mapping file has the same columns:

| Column | Meaning |
| --- | --- |
| `CSV Column` | Original column name as it appears in the source CSV. |
| `Import as Entity` | Qollabi entity the value is imported into (e.g. `Customers`, `Products`, `Categories`). |
| `Attribute` | Qollabi attribute on that entity. May be a compound like `Name + Polistype - Omschrijving + Maatschappij (using the space option)` when the value is a concatenation. |
| `External ID` | Marked `x` / `X` when the column (or combination) forms part of the entity's External ID. |
| `Additional info` | Free-text notes, most commonly flagging that the same CSV column feeds multiple targets. |

## Conventions

- **One CSV column can feed many targets.** Duplicate rows for the same CSV column are expected when the source column populates multiple Qollabi attributes or entities (e.g. `Naam` → `Customers.name` **and** `Customers.Last name`; `Domein - Omschrijving` → `Categories`, `Products`, and `Product templates`).
- **External IDs can be composite.** Each entity has exactly one External ID, but its value may be a concatenation of several CSV columns. A mapping row marked `X` with a `+ <other column>` note means "join these columns together to form the External ID".
- **Concatenation uses the space option** when noted in the `Attribute` cell. Interpret `Name + A + B (using the space option)` as `A_value + " " + B_value` joined onto the target attribute.
- **Composite External IDs are concatenated with no separator.** When an External ID is built from multiple columns (e.g. `Polistype - Omschrijving + Domein - Omschrijving`), join the values directly — no space, no dash, no delimiter of any kind. This applies even when other attributes on the same entity use the space option for their concatenation.
- **Treat the mapping as authoritative** when reconciling a CSV against the schema dump. If a column isn't listed in the mapping, fall back to schema-based reasoning and note it in the business requirement's iteration notes.

## Conventions for the translation layer

The `Import as Entity` and `Attribute` columns in a mapping name the **ultimate Qollabi target** for a CSV value — the table and column the value would live in inside a production Qollabi database. The translation layer that converts a CSV into Qollabi-shaped CTEs is expected to diverge from a literal column-for-column copy in the four cases below. Mappings stay flat and readable; this README is the single place that records how to interpret them.

### §1 — Address attributes

The `customers` table has no address columns — only `"addressId"` (FK → `addresses`). Addresses live in the `addresses` table, with `"countryId"` / `"cityId"` / `"postalCodeId"` FKs into further lookup tables.

When the mapping uses the pseudo-attributes `addressStreet`, `addressHouseNumber`, `addressUnitNumber`, `addressCountry`, `addressPostalCode`, `addressCity` on `customers`, the translation layer:

- Emits an `addresses` CTE with one row per distinct address in the CSV (`street`, `"houseNumber"`, `"unitNumber"`, and denormalized `"countryName"` / `"cityName"` / `"postalCode"` fields — see §2 for why we keep names instead of IDs).
- Emits a `customers` CTE whose `"addressId"` is a stable hash of the address fields, so multiple customers at the same address share one address row.
- Business-logic SQL joins `customers c → addresses a ON a.id = c."addressId"` and treats addresses as if they lived on the customer.

### §2 — ID columns fed by names

Columns like `ownerId`, `insurerId`, `situationId`, and the address FKs (`countryId`, `cityId`, `postalCodeId`) target ID fields in Qollabi, but the CSV only supplies human-readable descriptions — there's no separate source of IDs to look up against.

The CTE **keeps the Qollabi-named column** (e.g. `"ownerId"`) but stores the CSV value **as-is** (the owner's name, not an ID). Business-logic SQL can filter on these columns naturally: `WHERE "ownerId" = 'Jan Janssens'`.

**Portability caveat, recorded in every report that uses these columns:** when the same SQL is later ported to real Qollabi Postgres, each filter on a `*Id` column fed by a name becomes a join to the referenced table + filter on `name`. Flag it in the mapping report under *Dialect caveats*.

### §3 — jsonb money columns

`products."lastPremium"`, `products."totalValue"`, `products."premiumValue"`, and `product_templates."averagePrice"` are `jsonb`, not numbers. Qollabi stores money as:

```json
{"amount": <integer>, "currency": "<ISO-4217>"}
```

`amount` is the integer representation in minor units (cents for EUR). The schema confirms this: views cast `amount ->> 'amount'` to `integer`, never to `numeric` (see [`../qollabi-schema.sql:2152`](../qollabi-schema.sql) and `:2423`). So €149.99 becomes `{"amount": 14999, "currency": "EUR"}`.

The CTE parses the CSV value, multiplies by 100, casts to int, and wraps it in `jsonb_build_object('amount', ..., 'currency', 'EUR')` — defaulting currency to `EUR` unless the CSV supplies one. Handle European decimals (`"149,99"`) by normalizing the comma to a period before parsing.

### §4 — Code-list columns

Some columns have fixed enum values enforced by CHECK constraints (e.g. `customers."customerType"` at line 1301 of the schema dump). The CSV supplies a Dutch description; the target requires the exact enum literal.

The CTE applies a `CASE` expression to translate CSV values to enum values. Canonical translations live in [`../code-lists.md`](../code-lists.md). Extend that file whenever a new code-list column appears or a new source value is encountered. Unrecognized values become `NULL` and are counted in the requirement's sanity metrics.

---

## Risk objects & coverages (not yet in the schema dump)

The Qollabi schema dump at [`../qollabi-schema.sql`](../qollabi-schema.sql) does not yet reflect the final shape of risk objects and coverages. Use the model below — which matches the Brio mapping — as the source of truth for SQL generation involving these entities:

- **Customers** can have many **Products**.
- **Products** can contain many **Product risk objects** (concrete instances, e.g. two cars on one policy).
- **Product risk objects** follow a **Risk object type** (the template — e.g. "car").
- **Product risk objects** can have many **Product coverages** (concrete coverages attached to that risk object instance).
- **Product coverages** follow a **Coverage type** (the template — e.g. "theft").

Mental model: the relationship between **Risk object types / Product risk objects** and **Coverage types / Product coverages** is the same as the existing relationship between **Product templates / Products** — templates define the shape, instances carry the data and are attached to a parent.

When a business requirement reaches into risk objects or coverages, use these entity names in the generated SQL and note in the requirement file that the schema dump does not yet contain these tables.
