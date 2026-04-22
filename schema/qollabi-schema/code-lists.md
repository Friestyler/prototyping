# Code lists

Canonical Qollabi enum values and the CSV-value translations applied in the translation layer. Extend this file whenever a new code-list column appears in a mapping or a new source value is encountered.

---

## `customers."customerType"`

CHECK constraint in the schema: value must be `'naturalPerson'`, `'legalEntity'`, or `'group'` (see [`qollabi-schema.sql:1301`](qollabi-schema.sql)).

| Source system | CSV column | CSV value | Qollabi value |
| --- | --- | --- | --- |
| Brio | `Natuurlijk/Rechtsp - Omschrijving` | `Natuurlijk persoon` | `naturalPerson` |
| Brio | `Natuurlijk/Rechtsp - Omschrijving` | `Rechtspersoon` | `legalEntity` |
| Brio | `Natuurlijk/Rechtsp - Omschrijving` | `Groepering van natuurlijke en/of rechtspersonen` | `group` |

## `products."lifecycleStage"`

CHECK constraint in the schema: value must be `'bought'`, `'opportunity'`, or `'archived'` (see [`qollabi-schema.sql:2055`](qollabi-schema.sql)).

*No CSV translations defined yet — add entries as needed.*

---

## Columns that behave like code lists but aren't enums in the schema

These target columns are plain `text` (or FK) in the schema, but the CSV supplies a small set of repeating descriptions that should be normalized. Record translations here as they come up — they act as a living dictionary even though the DB doesn't enforce them.

### `customers."legalEntityType"`

Target type: `text`, no CHECK constraint.

| Source system | CSV column | CSV value | Qollabi value |
| --- | --- | --- | --- |
| *(to be populated on first real CSV)* | | | |

### `products."situationId"`

Target type: FK to a situation code table (not in the current schema dump). Per the mappings README §2, the CTE column holds the CSV description verbatim. Record the expected canonical labels here so business-logic SQL can filter on stable values.

| Source system | CSV column | CSV value | Canonical label |
| --- | --- | --- | --- |
| *(to be populated on first real CSV)* | | | |

---

## How the translation layer uses this file

The CTE for the affected entity applies a `CASE` expression mapping each CSV value to its Qollabi value. Example for `customerType`:

```sql
CASE "Natuurlijk/Rechtsp - Omschrijving"
  WHEN 'Natuurlijk persoon'                               THEN 'naturalPerson'
  WHEN 'Rechtspersoon'                                    THEN 'legalEntity'
  WHEN 'Groepering van natuurlijke en/of rechtspersonen'  THEN 'group'
  ELSE NULL  -- unrecognized value; flag in the mapping report's sanity metrics
END AS "customerType"
```

When a CSV value doesn't match any entry, the CTE emits `NULL` and the requirement's mapping report must flag it under *Sanity metrics* (count of unrecognized values, with the distinct unknowns listed).
