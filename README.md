# query-ui

Next.js query interface for `query-api`.

- `src/components/shell/` — icon sidebar, top tabs, resizable AI panel
- `src/components/landing/` — models, recent queries, new-query dialog
- `src/components/query/` — query tab, infinite table, Lucene bar, query builder
- `src/components/data-table/`, `src/lib/data-table|filters|store|table-schema/` — copied from
  `@data-table-filters` (openstatus); owned here
- `src/components/ai-elements/` — Vercel AI Elements
- `src/lib/api/` — API client + TanStack query options
- `src/lib/schema/` — API schema → table schema; table filter state → API filters
- `src/lib/store/tabs.ts` — persisted tab store (zustand); `adapters/tab` — per-tab filter store
- `src/app/api/proxy/[...path]` — BFF proxy to the API; `src/app/api/chat` — AI SDK route

```sh
pnpm install
cp .env.local.example .env.local   # QUERY_API_URL, ANTHROPIC_API_KEY
pnpm dev
```
