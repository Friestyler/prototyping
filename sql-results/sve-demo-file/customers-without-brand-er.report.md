# Customers without Brand ER

## Status
Draft (scaffolded example — SQL not yet written, result CSV not yet produced, mapping not yet captured)

## Linked files
- SQL:        sql-results/sve-demo-file/customers-without-brand-er.sql  *(empty placeholder)*
- Result CSV: *(not yet produced)*
- Source CSV: databases/sve-demo-file/csv-content/sve-demo-file.csv
- View layer: *(not yet built — `databases/sve-demo-file/qollabi-view.sql` needs to be created)*

## Original business requirement
Find individual customers between 50 and 75 years old who do not have Brand ER.

## Latest business requirement
Find individual customers between 50 and 75 years old who do not have Brand ER, taking into account all related records for the same dossier.

## Business rules
- Only include natural persons
- Age range must match the specified birth year boundaries
- Check absence of Brand ER across related records, not just one row
- Output should represent the final qualifying customer set

## Iteration notes
- Initial request was too row-based.
- Logic needed to account for grouped or related records.

## SQL

*Not yet written. Once the SQL is authored in `customers-without-brand-er.sql`, paste it here inside a ```sql fenced block so readers without a SQL editor can read it.*

## Source system
*Not yet determined — ask the user which system this CSV came from (Brio, Brokercloud, …) and build `databases/sve-demo-file/qollabi-view.sql` from the matching mapping before writing the business-logic SQL.*
