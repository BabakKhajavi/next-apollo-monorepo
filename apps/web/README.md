# Workflow dashboard

Next.js App Router dashboard backed by the NestJS GraphQL API. The dashboard shell and data sections render on the server. Recharts loads through client-only dynamic imports; interactive execution rows use Apollo's normalized cache and scoped AppSync Events channels.

## Local development

From the repository root:

```bash
pnpm install
pnpm --filter api db:up
pnpm --filter api db:create-tables
pnpm --filter api db:seed
DYNAMODB_ENDPOINT=http://localhost:8000 pnpm dev:api
```

In another terminal, run `pnpm dev:web`, then open http://localhost:4200. Set `GRAPHQL_URI=http://localhost:4000/graphql` and `NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql` in `apps/web/.env.local`. The existing `.env.local.example` shows deployed backend settings. `GRAPHQL_URI` serves React Server Components; `NEXT_PUBLIC_GRAPHQL_URI` serves Apollo client components.

Routes:

- `/`: KPI totals, 7/30/90-day trend, status donut, top workflows, recent executions, activity, and quick actions. Data sections stream independently.
- `/workflows`: workflow generation plus a server-paginated list (20 rows/page) and name filter.
- `/workflows/[id]`: workflow detail, approval, execution, and scoped live status updates.
- `/executions`: global recent executions with server pagination, date/status filters, and page-local column sorting.

The dashboard uses real GraphQL data. `pnpm --filter api db:seed-perf` is an **opt-in local-only** fixture with 1,000 workflows and 10,000 executions; it does not run in production. `pnpm nx codegen graphql-contracts` regenerates typed operations from the committed backend schema.

## Real time

When AppSync variables are configured, visible execution rows and activity entries subscribe to their own execution channels; updates patch Apollo's normalized cache. No AppSync settings are needed for local read-only use. The current API-key auth is a single-tenant demo setup, so this dashboard does not open a workspace-wide event stream. New executions enter the list on navigation; visible executions update live.

## AWS schema migration

`byRecent` is a new GSI on the Executions table. Apply `infra/terraform-backend` before deploying the API/web changes. Existing execution rows need `activityType = EXECUTION` for the new index; after the GSI becomes active, run `node apps/api/scripts/backfill-recent-index.mjs` with the target table, region, and credentials. The script defaults to DynamoDB Local. The API Lambda policy also gains `BatchGetItem` to resolve workflow names in recent rows.

## Design system

Reusable `Button`, `Badge`, `Panel`, `MetricCard`, `Skeleton`, and `EmptyState` components live in `packages/design-system`, with Tailwind-enabled Storybook stories. Run `pnpm nx storybook design-system` or `pnpm nx build-storybook design-system`.
