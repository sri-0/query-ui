# query-ui

Client-side Next.js interface for `query-api`. The browser talks to the API directly
(`NEXT_PUBLIC_QUERY_API_URL`, CORS); there are no server routes.

- `src/components/shell/` — icon sidebar, tab bar (AI toggle, tab menus), global resizable AI panel, shared `Panel` chrome, theme toggle
- `src/components/landing/` — models (largest first, expandable), paginated recent queries with avatars
- `src/components/query/composer/` — the query composer modal: models + Builder | Lucene | Full text | Semantic; schema-driven filter rows with typed value editors
- `src/components/query/` — query tab, infinite table wiring, single query input row, Lucene bar, model multi-select
- `src/components/query/table/` — row actions column and selection bar (CSV / JSON export)
- `src/components/data-table/`, `src/lib/data-table|filters|store|table-schema|table/` — copied from `@data-table-filters` (openstatus) and owned here
- `src/components/ai-elements/` — Vercel AI Elements (chat chrome only; no model wired yet)
- `src/lib/api/` — API client + TanStack Query options
- `src/lib/schema/` — API schema → table schema, table state → API request, builder drafts ↔ filters, saved query → tab
- `src/lib/store/` — persisted tabs (zustand), transient UI state, per-tab filter store adapter
- `src/app/query/[id]` — share link target: opens the audited query in a new tab

```sh
pnpm install
cp .env.local.example .env.local   # NEXT_PUBLIC_QUERY_API_URL
pnpm dev
```
