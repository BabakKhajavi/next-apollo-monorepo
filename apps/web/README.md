# Web app

Next.js App Router frontend for the NestJS GraphQL API, built as a
best-practice/performance demo (no custom domain — talks directly to the
deployed API Gateway and AppSync Events URLs).

- `/` — dashboard (RSC): workflow/execution counts from `dashboardStats`.
- `/workflows` — list (RSC) + a client "Generate workflow" form
  (`generateWorkflow` mutation, kicks off ai-worker's async generation).
- `/workflows/[id]` — detail: both the workflow header and the executions
  list stream from the server via `PreloadQuery` + `useSuspenseQuery`
  (Client Components resolving from server-preloaded data, not a second
  browser fetch), and both subscribe to live AppSync Events updates that
  patch Apollo's normalized cache directly — no polling, no manual
  refresh. `Approve`/`Execute` mutations rely on Apollo's automatic
  cache normalization (their response selects `{ id, status }`, which
  merges into the same cache entry the page's query reads).

## Local development

1. Start the API: `pnpm dev:api` (port 4000).
2. Start the web app: `pnpm dev:web` (port 3000).
3. Copy `.env.local.example` to `.env.local` and point it at either your
   local `apps/api` dev server or the deployed API Gateway/AppSync URLs
   (see `infra/terraform` outputs for the latter).

`GRAPHQL_URI`/`NEXT_PUBLIC_GRAPHQL_URI` are the server-side and
client-side GraphQL URLs respectively. The AppSync Events vars
(`NEXT_PUBLIC_APPSYNC_EVENTS_*`) are needed only for live updates to
work — the rest of the app functions without them (just no push
updates, until you reload).

## Data layer

The API schema and all typed queries/mutations come from
`packages/graphql-contracts` (single codegen source, offline-reproducible
against the committed `schema.graphql`) — not a separate per-app codegen
config. `packages/apollo-client` owns the Apollo Client setup (RSC
request-scoped client, browser `ApolloNextAppProvider`, cache policies
for cursor-based pagination) and the AppSync Events browser client
(`./realtime` subpath) used for real-time updates.

## Design system

Reusable components (`Badge`, `Button`) live in `packages/design-system`
with Storybook stories — run `nx run design-system:storybook` to view
them, or `nx run design-system:build-storybook` for a static build.
