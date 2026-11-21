# Dashboard performance check

Local measurement on 2026-11-21 with Chrome Lighthouse 13.6.0, production Next.js 16.4.5 builds, Lighthouse mobile preset, local NestJS API, and DynamoDB Local. The opt-in fixture held 1,003 workflows and 10,003 executions (including ordinary seed rows). These are lab results; production Core Web Vitals need real-user measurements.

| Page | Lighthouse performance | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| New dashboard (`/`), three consecutive runs | **100, 100, 100** | 0.9 s | 0.9 s | 40–70 ms | 0–0.01 |
| Previous workflow list (`/workflows`, 1,000 rows) | 95 | 0.9 s | 2.9 s | 0 ms | 0 |
| Paginated workflow list (`/workflows`, 20 rows) | **98** | 0.8 s | 2.5 s | 0 ms | 0 |

The old list's HTML response was 788,423 bytes and contained 1,000 workflow links. The paginated list returned 39,756 bytes and 20 links: **95.0% less HTML**, with a bounded browser DOM. A combined GraphQL request for totals, 30-day trend, top workflows, and 25 recent executions completed in 0.17 s locally; totals matched the fixture.

## Architecture behind the result

- Server Components render the shell and first view. The static header renders before date-range parsing; Suspense then streams KPI, analytics, table, and activity sections independently. Moving date-range parsing behind Suspense removed variable LCP delays seen during development.
- Chart imports are split from the server-rendered shell and loaded only on the client. The API reduces 10,000 executions to at most 90 daily points and five performance bars before transfer.
- Workflow list and recent executions use bounded server pages (20 and 25 rows). Column sorting applies only to the current page; virtualization would add complexity without benefit at these sizes.
- Apollo provider hydrates only interactive route sections. AppSync updates visible execution records and Apollo cache entries without full-page polling.
- System font stack avoids font downloads; no dashboard bitmap images are loaded.

## Reproduce

1. Start DynamoDB Local and the API as described in `README.md`.
2. Run `pnpm --filter api db:seed-perf` (local data only).
3. Build web with local `GRAPHQL_URI` and `NEXT_PUBLIC_GRAPHQL_URI`; run a production server.
4. Run `lighthouse http://localhost:<port>/ --only-categories=performance` and repeat for `/workflows`.

The API still computes all-time counts and 30-day analytics from DynamoDB index/table pages. At substantially higher volume, replace these reads with maintained aggregates and a dedicated workflow search index. The current AppSync API-key setup needs authenticated tenant scoping before multi-tenant production use.
