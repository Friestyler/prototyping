# Customers over 50 with an Auto-domain policy

## Status
Active

## Database
Demo_Merged_Final_2

## Source CSV
databases/Demo_Merged_Final_2/csv-content/Demo_Merged_Final_2.csv

## Linked SQL file
sql-results/Demo_Merged_Final_2/customers-over-50-with-auto-domain.sql

## Original business requirement
"I want all customers that are over 50 years with Auto domein."

## Latest business requirement
Return every distinct customer whose age is 50 or older **and** who holds at least one policy whose Qollabi category sits under the `Auto` domein (i.e. `Domein - Omschrijving = 'Auto'`).

## Business rules
- Age is computed from `Geboortedatum` against today's date. "Over 50" is interpreted inclusively (age ≥ 50). See Open doubts in the report.
- Customers are unique on `Dossier` (`customers."externalId"`).
- "Auto domein" is read against the Qollabi category parent (`categories."parentId" = 'Auto'`), not a product name substring.
- A customer qualifies if **any** of their products sits in the Auto domain — they don't need to hold only Auto policies.
- Deceased customers (non-null `Overlijdensdatum`) are kept for now; the user can ask to exclude them in a follow-up.

## Iteration notes
- Initial version. Interpretation of "over 50" as inclusive (≥ 50) is flagged in the report under *Open doubts* — flip to strict (> 50) if the user prefers.
