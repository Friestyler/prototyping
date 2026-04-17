# Qollabi Portfolio Intelligence — MCP

Two MCP transports ship in this repo:

| Transport         | Where                              | Use it for                                            |
| ----------------- | ---------------------------------- | ----------------------------------------------------- |
| HTTP (streamable) | `/api/mcp` on the Next.js app      | **Primary.** Multi-user, hosted, shareable via Claude.|
| stdio             | `mcp/server.ts` → `dist/qollabi-mcp.mjs` | Solo local use, single-user, no DB required.    |

The HTTP transport is what you publish to teammates. The stdio binary stays
around for read-only local hacking.

---

## HTTP MCP — `/api/mcp`

### What's exposed

**Tools**

| Tool                   | Purpose                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `list_smart_lists`     | The 5 built-in Priority Recommendations smart lists (catalogue only).                         |
| `get_smart_list`       | A built-in smart list with its full customer roster.                                          |
| `search_customers`     | Substring + product + premium + age filters over the full pool.                               |
| `preview_filter`       | Run a filter and see matching customer ids/count, without saving.                             |
| `list_my_smart_lists`  | Smart lists the calling user has saved.                                                       |
| `get_my_smart_list`    | One of the user's saved lists with full customer details.                                     |
| `create_smart_list`    | Save a new smart list. Accepts `customerIds` OR a `filter` definition.                        |
| `update_smart_list`    | Patch a saved list (rename, retype, recompute via `filter`, or set explicit `customerIds`).   |
| `delete_smart_list`    | Delete a saved list.                                                                          |

Customer data is the read-only seed pool from `lib/customer-database.ts`.
Saved smart lists live in Postgres (Neon) and are scoped per user.

### Setup

1. **Provision Postgres.** A free Neon project works — see
   [`lib/db/README.md`](../lib/db/README.md). Put the URL in `.env.local`:

   ```
   DATABASE_URL=postgres://user:pass@host/db?sslmode=require
   ```

2. **Initialise the schema and demo user:**

   ```sh
   npm run db:init
   ```

   This prints the demo user's `api_key`. Copy it.

3. **Run the app:**

   ```sh
   npm run dev   # locally
   # or deploy to Vercel — the route /api/mcp is included
   ```

### Registering with an MCP host

Use the **Streamable HTTP** transport (NOT stdio). Endpoint: `https://<host>/api/mcp`.
Authenticate with the user's api key as a Bearer token.

#### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "qollabi": {
      "url": "https://your-deployment.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer qol_<api_key>"
      }
    }
  }
}
```

#### Claude Code (`.mcp.json`)

```json
{
  "mcpServers": {
    "qollabi": {
      "type": "http",
      "url": "https://your-deployment.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer qol_<api_key>"
      }
    }
  }
}
```

Or via the CLI:

```sh
claude mcp add --transport http qollabi https://your-deployment.vercel.app/api/mcp \
  --header "Authorization: Bearer qol_<api_key>"
```

### Adding more users

Each user gets their own row in `users` with a unique `api_key`. For now,
insert manually — there's no signup UI. Example:

```sql
insert into users (id, email, api_key)
values ('alice', 'alice@example.com', 'qol_' || encode(gen_random_bytes(24), 'hex'));
```

Then share the resulting `api_key` with that person to put in their MCP config.

---

## stdio MCP (legacy, single-user)

Useful when you don't want to spin up Postgres. Read-only — has the catalogue
and customer search, no saved-list CRUD (saved lists need persistence).

### Dev (no build)

```sh
npm run mcp:dev
```

Uses `tsx` to run `mcp/server.ts` directly.

### Build + run

```sh
npm run mcp:build   # emits dist/qollabi-mcp.mjs (self-contained ESM)
npm run mcp:start
```

### Registering (Claude Desktop)

```json
{
  "mcpServers": {
    "qollabi-local": {
      "command": "node",
      "args": ["/absolute/path/to/qollabi-portfolio-intelligence/dist/qollabi-mcp.mjs"]
    }
  }
}
```
