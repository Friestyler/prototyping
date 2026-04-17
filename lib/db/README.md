# Persistence layer

User-saved smart lists are stored in Postgres. The customer pool itself stays
in code (`lib/customer-database.ts`) as immutable prototype data.

## Provisioning

1. Create a free Neon project at https://neon.tech (or use any Postgres — the
   `@neondatabase/serverless` driver speaks plain Postgres over HTTP/WebSocket).
2. Copy the connection string into `.env.local`:

   ```
   DATABASE_URL=postgres://user:pass@host/db?sslmode=require
   ```

3. Initialise the schema and seed the demo user:

   ```sh
   npm run db:init
   ```

   This is idempotent — re-running won't drop existing data.

## What's stored

| Table              | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `users`            | One row per person. Each has a `api_key` used for MCP auth.   |
| `user_smart_lists` | Saved smart lists, scoped per user. `customer_ids` is JSONB.  |

## Demo user

`npm run db:init` seeds a single user with id `demo`, email `demo@qollabi.app`,
and a generated api key (printed to stdout the first time). The web app is
single-tenant for now and always reads/writes the demo user's lists.

The MCP server (`/api/mcp`) is multi-tenant — the caller's api key picks
which user's lists they see and can edit.
