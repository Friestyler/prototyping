# Customers without Brand ER

## Status
Active

## Database
sve-demo-file

## Source CSV
databases/sve-demo-file/csv-content/sve-demo-file.csv

## Linked SQL file
sql-results/sve-demo-file/customers-without-brand-er.sql

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
- Initial request was too row-based
- Logic needed to account for grouped or related records
