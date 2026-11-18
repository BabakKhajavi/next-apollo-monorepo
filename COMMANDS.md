# Setup Commands Log

## 1. Scaffold Next.js app (web)
```
rm -rf apps/web
cd apps && npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*" --no-turbopack
```
Replaced hand-written stub with real create-next-app output (TS, Tailwind v4, ESLint, App Router).

## 2. Clean duplicate workspace files from web scaffold
```
cd apps/web && rm -rf node_modules pnpm-lock.yaml pnpm-workspace.yaml AGENTS.md .next
```
create-next-app generates its own lockfile/workspace file assuming standalone project; removed so root pnpm workspace governs instead.

## 3. Re-layer feature structure into web
```
mkdir -p "src/app/(public)/login" "src/app/(public)/register" "src/app/(protected)/dashboard" "src/app/(protected)/users" "src/app/(protected)/products" src/features/auth/components src/features/auth/hooks src/features/auth/utils src/features/users/{components,hooks,types} src/features/users/graphql/{queries,mutations,fragments,generated} src/features/dashboard src/features/products src/providers src/lib
```
Restored Architecture.md's route groups + features/ domain folders on top of the real scaffold.

## 4. Scaffold NestJS app (api)
```
rm -rf apps/api
cd apps && npx @nestjs/cli@latest new api --package-manager pnpm --skip-git --language TS
```
Replaced hand-written stub with real Nest CLI output (vitest, oxlint, nest-cli.json, main.ts/app.module.ts boilerplate).

## 5. Clean duplicate workspace files from api scaffold
```
cd apps/api && rm -rf node_modules pnpm-lock.yaml AGENTS.md .gitattributes
```
Same reason as step 2 — root pnpm workspace manages installs, not a nested one.

## 6. Re-layer module structure into api
```
mkdir -p src/modules/auth src/modules/users/{application,domain,infrastructure,presentation} src/modules/products src/common/{guards,filters,interceptors} src/config
touch src/lambda.ts
```
Restored Architecture.md's modules/common/config folders on top of the real scaffold.

## 7. Init git repo
```
git init
```
Repo had no git history yet.

## 8. Install workspace dependencies
```
pnpm install
```
Resolves and links all `apps/*` and `packages/*` per `pnpm-workspace.yaml`.

## 9. Initialize Nx on the existing workspace
```
npx nx@latest init
```
Guided setup, choices made:
- Setup type: **Guided**
- Scripts needing run-order: **build** only (dependents must build after dependencies)
- Plugins installed: **@nx/next**, **@nx/eslint**, **@nx/vitest**, **@nx/oxlint**
- AI agent integration: **Claude Code**
- Nx Cloud (remote caching / self-healing CI): **declined**

Replaced hand-written `nx.json`/`project.json` guesses with real detected config and plugin-based target inference.

## 10. Wire workspace dependency edges (web)
```
pnpm add "@monorepo/design-system@workspace:*" "@monorepo/apollo-client@workspace:*" "@monorepo/graphql-contracts@workspace:*" "@monorepo/auth@workspace:*" --filter web
```
Added `@monorepo/*` packages as real deps in `apps/web/package.json` so the Nx project graph draws edges from `web` to the packages it depends on (quoted to stop zsh from glob-expanding `*`).

## 11. Wire workspace dependency edges (api)
```
pnpm add "@monorepo/apollo-server@workspace:*" "@monorepo/graphql-contracts@workspace:*" "@monorepo/ai-helper@workspace:*" "@monorepo/realtime@workspace:*" "@monorepo/auth@workspace:*" --filter api
```
Same as step 10, scoped to `apps/api`.

## 12. Add diagnostic npm scripts to root package.json
Added to `scripts`:
- `graph` → `nx graph` — visualize full project dependency graph
- `show:web` / `show:api` → `nx show project <name> --web` — inspect one project's targets/deps
- `affected:build` / `affected:test` / `affected:lint` → `nx affected -t <target>` — run only on projects changed vs. base branch
- `reset` → `nx reset` — clear Nx's local cache/daemon state when something looks stale or wrong

Run with `pnpm run <script>` (e.g. `pnpm run graph`).

## 13. Add affected-visualization scripts to root package.json
Added to `scripts`:
- `affected:graph` → `nx affected:graph` — browser graph highlighting only projects affected vs. base branch
- `affected:list` → `nx show projects --affected` — plain text list of affected project names

Useful before `affected:build`/`affected:test` to sanity-check scope first.

## 14. Fix removed Nx command
`nx affected:graph` was removed in Nx 19 (this workspace runs Nx 24); errored with "command not found" guidance pointing to `nx graph --affected`. Updated the `affected:graph` script in root `package.json` to:
```
nx graph --affected
```

## 15. Set up versioning with Nx Release
Added `release` block to `nx.json`:
```json
"release": {
  "projectsRelationship": "independent",
  "version": { "conventionalCommits": true },
  "changelog": { "projectChangelogs": true, "workspaceChangelog": false },
  "git": { "commit": true, "tag": true }
}
```
- **Independent** versioning — each package/app bumps on its own, only when it actually changes (not lockstep across the whole workspace).
- **Conventional commits** drive the bump — `fix:` → patch, `feat:` → minor, `feat!:`/`BREAKING CHANGE:` → major, scoped to the commits touching each project.
- Per-project `CHANGELOG.md` generated, no single workspace-wide changelog.
- Commits the version bump + changelog and tags the release in git automatically.

Added scripts to root `package.json`:
- `release:dry` → `nx release --dry-run` — preview what would bump/change, no writes
- `release` → `nx release` — actually bump versions, write changelogs, commit, tag

Requires real commit history with conventional-commit messages (`feat:`, `fix:`, etc.) to compute bumps correctly — always run `release:dry` first to sanity-check before `release`.

Note: `nx release` is never invoked automatically — versions stay frozen through however many commits happen in between. It only bumps when explicitly run, and at that point reads every commit since the last release tag per project, picking one bump from all of them (not one bump per commit).

## 16. Add dedicated release workflow (CI-triggered, not per-commit)
Created `.github/workflows/release.yml`:
- Triggers: `workflow_dispatch` (manual button in GitHub Actions UI) or push to a `release/**` branch — deliberately NOT on every push/merge to `main`, so versions stay frozen during normal development.
- `fetch-depth: 0` on checkout — needed so conventional-commits analysis can see full tag history.
- Configures a bot git identity so `nx release`'s auto-commit/tag has an author.
- Runs `pnpm nx release --yes` (non-interactive) to bump, changelog, commit, and tag.

This is the actual promotion point — run this workflow when moving a batch of work to sandbox/release, not on every merge.

## 17. Add independent dev-server scripts for web/api
Added to root `package.json`:
- `dev:web` → `nx serve web` — runs `next dev` for the web app only
- `dev:api` → `nx serve api` — runs `nest start --watch` for the api app only

Run each in its own terminal (`pnpm run dev:web` in one tab, `pnpm run dev:api` in another) so they run independently instead of combined under `run-many`.

## 18. Add production preview target for web (Core Web Vitals testing)
Added `preview` target to `apps/web/project.json`:
```json
"preview": {
  "dependsOn": ["build"],
  "executor": "nx:run-commands",
  "options": { "command": "next start", "cwd": "apps/web" }
}
```
Dev mode (`next dev`) skips production optimizations (minification, RSC payload shaping, etc.), so it gives misleading Core Web Vitals numbers. `preview` uses Nx's own task graph (`dependsOn: ["build"]`) to run a real production build first — cached if unchanged — then serves it with `next start`.

Added root script: `preview:web` → `nx run web:preview`.

## 19. Install Apollo Client skill
```
npx skills add apollographql/skills --skill apollo-client
```
Installs Apollo's official best-practices skill from `apollographql/skills` into `.agents/skills/apollo-client`, symlinked to `.claude/skills/apollo-client` for Claude Code. Teaches Claude Apollo Client conventions (caching, fragments, hooks, error handling) when working in `packages/apollo-client` or any `apps/*/src/**/graphql`.

## 20. Implement `packages/apollo-client` + wire into `apps/web`

Full implementation per Apollo's official best-practice skill. Package ships three entry points (`.`, `./providers`, `./nextjs`) so server-only and client-only code never leak into the wrong bundle — isomorphic cache/links core, a `"use client"` `ApolloWrapper`, and an RSC-only `createRSCClient`. `apps/web` wired with `ApolloProvider` in `layout.tsx`, an RSC client singleton (`src/lib/apollo-rsc.ts`), and a temporary demo page (`src/app/(public)/demo`) proving fragment colocation, data masking, Suspense queries, and typed codegen end-to-end against the public Countries API (`https://countries.trevorblades.com/graphql`) — a placeholder until `apps/api` ships a real schema.

Also: disabled `cacheComponents`/`partialPrefetching` in `next.config.ts` (unconfirmed compatibility with Apollo's Next.js RSC integration) and added `transpilePackages` for all `@monorepo/*` deps (Next doesn't transpile workspace TS source by default).

```
pnpm add "@apollo/client-integration-nextjs@^0.14.0" --filter web --filter apollo-client
```
Real published version — my first guess (`^4.0.0`) didn't exist on npm.

```
pnpm add -D @swc-node/register -w
```
Fixed a pre-existing issue surfaced by this work: Nx's project-graph calculation couldn't load any `.ts` config file with type annotations (`next.config.ts`'s `: NextConfig`) — Node's native type-stripping fails on that syntax, and Nx's fallback transpiler (`@swc-node/register` or `ts-node`) wasn't installed to recover. This blocked every `nx` command workspace-wide, not just this task.

`graphql` pinned to `^16.9.0` (down from `^17.0.0`) in both `apps/web` and `packages/apollo-client` — `@graphql-codegen/cli` 6.x's plugins don't yet support graphql 17 (crashed opaquely on `Generate`); Apollo Client 4.3.7 itself supports both `^16` and `^17`, so 16 was the safe common choice.

Pending: `pnpm run preview:web` visual check (continents render, single RSC-prefetched request, no duplicate client refetch) — not yet run.

## 21. Phase 1 — NestJS + Apollo Server 5, code-first GraphQL, codegen contracts

Added `@nestjs/graphql` + `@nestjs/apollo` (ApolloDriver) to `apps/api` for dev: `GraphQLModule.forRoot` with `autoSchemaFile` writing `packages/graphql-contracts/schema.graphql` on boot, so codegen can run offline against it in CI without a live server. One resolver (`HealthResolver`, `health: String!`) proves the wiring.

For production Lambda, deliberately did **not** route requests through Nest's HTTP adapter: `apps/api/src/lambda.ts` boots Nest once per warm container via `NestFactory.createApplicationContext` (DI only, no Express), pulls the built `GraphQLSchema` out via `GraphQLSchemaHost`, then hands it to `packages/apollo-server`'s `createLambdaHandler(schema)` — a bare `@apollo/server` instance wrapped by `@as-integrations/aws-lambda`'s `startServerAndCreateLambdaHandler` + `createAPIGatewayProxyEventV2RequestHandler`. Keeps Nest DI/decorators for authoring resolvers, drops Nest's Express middleware from the Lambda hot path. `packages/apollo-server` stays schema-agnostic (takes a `GraphQLSchema` in) so it has no dependency on Nest.

```
pnpm add @nestjs/apollo @nestjs/graphql @as-integrations/express5 graphql --filter api
pnpm add -D @types/aws-lambda --filter api
pnpm add @apollo/server @as-integrations/aws-lambda --filter @monorepo/apollo-server
pnpm add -D @types/aws-lambda --filter @monorepo/apollo-server
pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typed-document-node --filter @monorepo/graphql-contracts
```
`@as-integrations/express5` wasn't in the original plan — `@nestjs/apollo`'s `ApolloDriver` needs it at runtime for the dev Express HTTP listener; surfaced as a `PackageLoader` error on first boot, not a build-time error.

Replaced `packages/graphql-contracts`'s placeholder `codegen.yml` target with `codegen.ts` (same plugin config shape as `apps/web/codegen.ts`: `typescript` + `typescript-operations` + `typed-document-node`, `inlineFragmentTypes: "mask"`), schema sourced from the generated `schema.graphql` file, documents from `src/operations/**/*.graphql`. Ran `pnpm nx run graphql-contracts:codegen` once to prove it end-to-end against the real `Health` query.

Verified: `nx build api`, `nx build apollo-server`, `nx build graphql-contracts`, `nx test api`, `nx lint api` all green; `node dist/main.js` + `curl -X POST /graphql -d '{"query":"query { health }"}'` returned `{"data":{"health":"ok"}}`.

Not committed — holding per explicit instruction.

## 22. Remove `packages/apollo-server` — single function, single consumer, not a package

`packages/apollo-server` held exactly one thing: `createLambdaHandler(schema)`, used only by `apps/api/src/lambda.ts`. No second consumer, no shared config, no other responsibility — not enough to justify a standalone package (unlike `graphql-contracts`, which genuinely does several jobs: schema generation target, codegen config, operation docs, generated types). Deleted the package; inlined the `new ApolloServer({ schema })` + `startServerAndCreateLambdaHandler(...)` call directly into `lambda.ts`. `apps/api/package.json` now depends on `@apollo/server` and `@as-integrations/aws-lambda` directly instead of via the removed workspace package. Removed the stale `@monorepo/apollo-server` path entry from `tsconfig.base.json`.

```
rm -rf packages/apollo-server
```

Surfaced a real TypeScript issue while inlining: `apps/api`'s `tsconfig.json` uses `"module": "nodenext"`, and under that resolution mode `@apollo/server`'s `ApolloServer` type resolves differently depending on the importing package's own module format — `@apollo/server` ships separate ESM (`dist/esm`) and CJS (`dist/cjs`) type declarations, and `@as-integrations/aws-lambda` has no `"type"` field in its `package.json` (defaults CommonJS), so it resolves the CJS declaration for its own `ApolloServer` parameter while our ESM file resolves the ESM one. Same class at runtime, two nominally incompatible declarations at compile time (TS2345, private field identity mismatch) — a known dual-package hazard, not something the removal introduced; the old package avoided it only because its `tsconfig.json` used classic `"moduleResolution": "Node"`, which ignores conditional `exports` and always resolves to one declaration file. Fixed with a documented `as unknown as` cast at the single call site in `lambda.ts` — safe since it's the identical package underneath, purely a type-identity artifact.

Verified: `nx build api`, `nx test api`, `nx lint api` green; `node dist/main.js` + `curl -X POST /graphql -d '{"query":"query { health }"}'` still returns `{"data":{"health":"ok"}}`.

Not committed — holding per explicit instruction.

## 23. Phase 2 — DynamoDB + GraphQL (Workflows, Executions, dashboard stats, cursor pagination)

Two tables, matching the original spec:

- **Workflows**: PK `id`. No GSI — "list all workflows" is a `Scan` with a page `Limit`, a deliberate call at single-tenant demo scale (noted in `workflow.repository.ts`); a GSI keyed on `ownerId` is the right fix once auth/multi-tenancy lands.
- **Executions**: PK `id`. **GSI `byWorkflowId`** (PK `workflowId`, SK `createdAt`) for "executions for this workflow, newest first" — the one access pattern that genuinely needs an index. **GSI `byStatus`** (PK `status`, SK `createdAt`) so the dashboard can count executions per status via `Query ... Select COUNT` instead of a full scan.

Each domain is its own Nest feature module (`apps/api/src/graphql/{workflow,execution,dashboard}/`: model, repository, service, resolver, module), imported into `AppModule` rather than flattened into its `providers` array — the earlier `WorkflowResolver` sat directly in `AppModule.providers`; moved into `WorkflowModule` as part of this phase. All three still build into **one** GraphQL schema — GraphQL doesn't have "schema per module"; that's what Apollo Federation subgraphs are for, a different architecture not needed here.

DynamoDB client lives in `apps/api/src/dynamodb/dynamodb.module.ts` (`@Global()`, exports a `DynamoDBDocumentClient` under the `DYNAMODB_DOCUMENT_CLIENT` token) — same client code works against DynamoDB Local (dev, `DYNAMODB_ENDPOINT` set) and real DynamoDB in Lambda (no endpoint override, IAM role via default credential chain). Kept inside `apps/api` rather than a new shared package — same reasoning as the `apollo-server` removal: no second consumer yet. It'll likely move once `apps/worker` (Phase 4) also needs it.

Cursor pagination (`apps/api/src/common/cursor.util.ts` + `paginated.ts`): the GraphQL `after` cursor is just base64 JSON of DynamoDB's own `LastEvaluatedKey` — no hand-rolled offset paging. `Paginated(ItemType)` is Nest's documented generic-type-factory pattern for code-first GraphQL (no native generics).

```
pnpm add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb graphql-type-json ulid --filter api
docker compose up -d       # DynamoDB Local
node apps/api/scripts/create-tables.mjs
node apps/api/scripts/seed.mjs
```

Three real bugs surfaced and fixed along the way, each worth remembering:

1. **Generic `Paginated()` type invisible in schema** — `@ObjectType(name, { isAbstract: true })` only registers the type when something *else* subclasses it with its own `@ObjectType()`; used directly as a resolver return type, it never appears in the schema (`CannotDetermineOutputTypeError`). Fix: drop `isAbstract`.
2. **Same error, different cause** — calling `Paginated(Workflow)` *inside* the `@Query(() => ...)` thunk means `@ObjectType()` only runs when the thunk is invoked, during schema build — but Nest's lazy-metadata flush (which registers decorated types) runs once, earlier. Fix: call `Paginated(Workflow)` once at module scope (`const WorkflowPage = Paginated(Workflow)`), so decoration happens at import time like any other type.
3. **`GraphQLJSON` default import resolved to the whole module namespace, not the scalar** — `graphql-type-json`'s CJS build exports its default via `exports["default"] = ...` (bracket notation), which Node's ESM/CJS interop (`cjs-module-lexer`) fails to statically detect; a default import silently got the entire exports object instead, so `instanceof GraphQLScalarType` was `false` and Nest couldn't map the field type. Fix: `import { GraphQLJSON } from 'graphql-type-json'` (named export is detected fine).
4. **`GraphQLISODateTime.serialize()` returned `null`** for `createdAt`/`updatedAt` — the built-in scalar calls `.toISOString()` on the resolved value, but the model fields held plain strings (DynamoDB's storage format). Fix: model fields are `Date` (matches what the scalar expects); repositories convert ISO string ↔ `Date` at the DynamoDB boundary (`fromItem`/`toItem` in each repository).

Verified end-to-end against DynamoDB Local + seed data: `workflows(first: 10)`, `executions(workflowId: ..., first: 10)` (via `byWorkflowId` GSI), `dashboardStats` (via `byStatus` GSI), `createWorkflow` mutation. `nx test api`, `nx lint api` green.

## 24. Phase 3 — AI Automation Builder: async `generateWorkflow`, SQS, AI worker Lambda, AppSync Events

Why async instead of calling the LLM inline in the resolver: API Gateway's 29s timeout doesn't fit structured-output generation reliably, `langchain` + provider SDKs are heavy to bundle into the main API Lambda's cold start, and AI calls shouldn't be able to starve Lambda concurrency for plain CRUD queries. Same shape as the existing SQS → worker pattern already planned for execution — `generateWorkflow` enqueues and returns immediately; a separate worker consumes, generates, and pushes the result over AppSync Events instead of the client polling.

**`packages/ai-helper`** — filled in as a genuinely reusable AI toolkit, not a one-off for this feature:
- `createChatModel(provider: 'anthropic' | 'openai' | 'gemini', options?)` — single factory entry point; `gemini` throws with a clear "add `@langchain/google-genai`" message since that package isn't installed yet
- `generateStructured(model, zodSchema, prompt)` — generic wrapper over LangChain's `.withStructuredOutput()`, not specific to workflows; any future feature needing schema-constrained LLM output goes through this
- `schemas/workflow-definition.ts` — `WorkflowDefinitionSchema` (Zod): one `trigger` (`schedule`/`webhook`/`event`) + 1+ `actions` (`sendEmail`/`httpRequest`/`runScript`), each with an open `config` record. This is the only workflow-specific piece; everything else in the package is provider-agnostic.

**GraphQL layer decision** — `Workflow.definition` stays a `JSON` scalar rather than being modeled as proper GraphQL types. AI-generated content needs to tolerate new trigger/action shapes without a schema migration every time; Zod validates the one place it's produced (the AI worker, before persisting) instead of GraphQL validating every read. Type safety where it's actually needed (the write path), flexibility where structure legitimately varies (the read path).

**`apps/api` changes:**
- `WorkflowStatus` gained `GENERATING` and `GENERATION_FAILED`
- `src/sqs/` — new `SqsModule` (`@Global`, mirrors `DynamoDbModule`'s shape) + `SqsService.sendMessage`
- `WorkflowService.generateFromPrompt(prompt)` — writes a `GENERATING` row with an empty `definition` placeholder, enqueues `{workflowId, prompt}`, returns immediately (no LLM call in this process)
- `WorkflowResolver.generateWorkflow(prompt: String!): Workflow!` mutation

**`apps/ai-worker`** — new Nx app, plain TypeScript (no NestJS — a single SQS-consumer handler doesn't need a DI container):
- `handler.ts` — `processMessage`: `createChatModel('anthropic')` → `generateStructured(..., WorkflowDefinitionSchema, ...)` → update the `Workflows` row (`DRAFT` + `definition`, or `GENERATION_FAILED` on error) → `publishEvent` to AppSync Events channel `/workflow-updates/{workflowId}` (per-workflow channel so a client only subscribes to the generation it's waiting on, not a firehose)
- `dynamodb.ts` — deliberately duplicates a ~20-line `UpdateCommand` rather than importing `apps/api`'s `WorkflowRepository`: Nx apps can't depend on each other, and the worker only ever needs this one narrow write
- `lambda.ts` — sole entry point, `SQSHandler` for an event-source-mapping trigger. No local runner by design: this Lambda is small enough that deploy-and-test is the whole workflow, not worth a local-polling stand-in (unlike `apps/api`, which has real reason to run outside Lambda — a long-lived dev server).
- On failure, rethrows after writing `GENERATION_FAILED` + publishing the error, so SQS's own redrive policy (not application code) handles retry/DLQ

**`packages/realtime`** — filled in with `publishEvent(config, { channel, events })`, a thin wrapper over AppSync Events' HTTP publish API (`POST {httpEndpoint}/event`, `x-api-key` header — API_KEY auth was the explicit choice for demo simplicity over IAM/Cognito).

**No local runner for `ai-worker` — removed after initial build.** First pass added a `main.ts` dev entry that long-polled the real SQS queue in a loop (stand-in for the Lambda event-source-mapping trigger, same hybrid-entry-point shape as `apps/api`'s `main.ts`/`lambda.ts`). Explicitly rejected: this Lambda is small enough that deploy-and-test is the right workflow, and the polling loop was unneeded complexity for its own sake. Deleted `main.ts`, the `serve` project target, and the `tsx` dev dependency — `lambda.ts` is now the only entry point. SQS and AppSync Events still have no local emulator wired into this repo (unlike DynamoDB's `dynamodb-local`), but that's moot now: there's no local path to need one for.

**`infra/terraform/`** — new directory, pulling a slice of Phase 6 forward (per the standing "Terraform exclusively, no CDK/CloudFormation" rule; `infra/stacks/` CDK stubs are untouched, still dead weight):
- `sqs.tf` — `workflow-generation` queue + `workflow-generation-dlq`, redrive after 3 receives
- `appsync-events.tf` — `aws_appsync_api` (Events API, API_KEY auth) + `aws_appsync_channel_namespace` (`workflow-updates`) + `aws_appsync_api_key`
- `outputs.tf` — queue URL/ARN, AppSync HTTP + realtime endpoints, API key (sensitive)
- **`terraform apply` was not run** — it provisions real, billable AWS resources under your account; left for you to run manually with your own credentials once ready.

**Fixed along the way (pre-existing, not caused by this phase):** `packages/graphql-contracts/src/operations/workflow.graphql` still queried `workflows { id name status }` as a flat list — stale since Phase 2 changed `workflows` to return `WorkflowPage` (`{ items, nextCursor }`). Nobody updated the hand-written operation doc after that pagination change, so `graphql-contracts:codegen` failed validation. Fixed: wrapped the field selection in `items { ... }` + added `nextCursor`.

```
pnpm install    # @langchain/anthropic, @langchain/core, @langchain/openai, zod (ai-helper);
                # @aws-sdk/client-sqs (api)
mkdir -p infra/terraform apps/ai-worker/src
nx run-many -t build lint test -p ai-helper realtime ai-worker api
nx run graphql-contracts:codegen
rm apps/ai-worker/src/main.ts   # removed — see "No local runner" above
```

Verified: `schema.graphql` regenerates correctly via a local `nx serve api` boot (`generateWorkflow(prompt: String!): Workflow!` present, `GENERATING`/`GENERATION_FAILED` in `WorkflowStatus`). `nx build/lint/test` green across `ai-helper`, `realtime`, `ai-worker`, `api`. **Not verified end-to-end** — that requires `terraform apply` (real SQS queue + AppSync Events API), an `ANTHROPIC_API_KEY`, and deploying `ai-worker` as an actual Lambda, none of which exist yet; per your call, that verification happens after deploy, not locally.

Not committed — holding per explicit instruction (ask before I commit/push this phase, same as Phase 2).

## 25. Phase 4 — Execution Pipeline: `executeWorkflow` mutation, SQS, execution worker Lambda, real `httpRequest`

Same async shape as Phase 3's workflow generation: `executeWorkflow(workflowId)` validates the workflow is `ACTIVE`, writes a `PENDING` `Execution` row, enqueues to a new SQS queue, returns immediately. A new `apps/execution-worker` Lambda consumes it, runs each action in `Workflow.definition.actions` in order, and pushes `RUNNING`/`SUCCEEDED`/`FAILED` over AppSync Events on a per-execution channel.

**Two scope decisions made explicitly before building, not defaulted:**
- **Action execution realism:** `httpRequest` actually executes (real `fetch`) — genuinely demoable without extra infra. `sendEmail`/`runScript` are structural stubs (log + succeed) — no SES, no sandboxed script runtime. Proves the pipeline's shape without the infra cost of making all three real.
- **Trigger scope:** manual/webhook-style execution only (`executeWorkflow` mutation is the only entry point). The `schedule` trigger type still exists in `WorkflowDefinitionSchema` (Zod) but nothing consumes it — no EventBridge Scheduler wiring. Documented gap, not an oversight.

**`apps/api` changes:**
- `ExecutionRepository.put` — the only new write path; status transitions after that belong to the worker, same split as `WorkflowRepository`/`ai-worker` in Phase 3
- `ExecutionService.execute(workflowId)` — looks up the `Workflow` via `WorkflowService` (so `ExecutionModule` now imports `WorkflowModule`), throws `BadRequestException` if not `ACTIVE`, creates the `PENDING` row, enqueues `{executionId, workflowId, actions}` by reading `workflow.definition.actions` (cast from the `JSON` scalar — safe because that shape is written exclusively via `WorkflowDefinitionSchema` in Phase 3)
- `ExecutionResolver.executeWorkflow` mutation
- Cleanup: `SqsService` moved into `SqsModule`'s own `providers`/`exports` (it's `@Global`, so every feature module gets it for free — matches `DynamoDbModule`'s shape) instead of each feature module re-registering it. `WorkflowModule` no longer lists it directly.

**`apps/execution-worker`** — new Nx app, identical shape to `apps/ai-worker` (`handler.ts` entry only, no local runner, same reasoning as Phase 3: small enough that deploy-and-test is the right workflow):
- `services/run-action.ts` — `runAction(action)`, switches on `action.type`; the one place the three action types' realism differs
- `services/workflow-execution.service.ts` — `processMessage`: `RUNNING` → run every action in sequence → `SUCCEEDED`, or catch → `FAILED` + rethrow (SQS redrive handles retry/DLQ, same as `ai-worker`)
- `repositories/execution.repository.ts` — narrow, self-contained `Executions` table update, deliberately not sharing `apps/api`'s `ExecutionRepository` (apps can't depend on each other in this Nx workspace)
- `realtime/execution-channel.ts` — `channelFor(executionId)` → `/execution-updates/{executionId}`, mirrors `ai-worker`'s per-entity channel pattern
- `types/index.ts` — imports `Action` from `@monorepo/ai-helper` rather than redefining it; `packages/ai-helper/src/workflow-definition.schema.ts` now also exports `type Action = z.infer<typeof ActionSchema>` so the action shape has one source of truth across `apps/api`, `apps/ai-worker`'s generation path, and this worker's execution path

**Hit and fixed: circular import in `apps/api/src/sqs/`** — `sqs.module.ts` imported `SqsService` (to register it as a provider) while `sqs.service.ts` imported `SQS_CLIENT` back from `sqs.module.ts`. Direct two-file cycle; Node's ESM loader hit `ReferenceError: Cannot access 'SqsService' before initialization` at boot (only surfaces at runtime — `nx build`/`tsc` doesn't catch circular *value* imports, only type ones). Fixed by extracting the token into its own `sqs.tokens.ts`, so neither file imports the other.

**`infra/terraform/`** — extended, not new: `workflow_execution` queue + its own DLQ in `sqs.tf`; `execution-updates` channel namespace added to the existing `aws_appsync_api` in `appsync-events.tf` (one AppSync Events API serves both Phase 3 and Phase 4 channels — no need for a second API). New outputs for the execution queue's URL/ARN. Still not applied.

```
mkdir -p apps/execution-worker/src/{services,types,repositories,realtime}
nx run-many -t build lint test -p api ai-helper execution-worker ai-worker realtime
nx run graphql-contracts:codegen
```

Verified: `schema.graphql` regenerates correctly via a local `nest start` boot (`executeWorkflow(workflowId: ID!): Execution!` present; boot log confirms clean module init — `DynamoDbModule`, `SqsModule`, `WorkflowModule`, `ExecutionModule`, `DashboardModule` all initialize without error, catching the circular-import bug above before it shipped). `nx build/lint/test` green across `api`, `ai-helper`, `execution-worker`, `ai-worker`, `realtime`, `graphql-contracts`. **Not verified end-to-end** — same gap as Phase 3: needs `terraform apply`, and `execution-worker` deployed as an actual Lambda, before a real `executeWorkflow` → action-run → AppSync push can be observed.

## 26. Phase 6 — Deployable infra: DynamoDB tables, 3 Lambdas, API Gateway, IAM

Fills in the actual compute/storage layer Phases 2-4 assumed would exist. Before this, `infra/terraform/` only had SQS + AppSync Events (pulled forward early in Phase 3); nothing provisioned DynamoDB, ran any app as a real Lambda, or exposed the GraphQL API publicly.

**One real decision made explicitly before building:** how to package `api`/`ai-worker`/`execution-worker` for Lambda, given pnpm's symlinked `node_modules` doesn't zip cleanly. Chose **esbuild bundling** (one `handler.js` per app, all deps inlined) over `pnpm deploy`+zip-node_modules or container-image Lambdas — smallest moving parts, standard pattern for Node Lambdas in pnpm monorepos.

**Build tooling:**
- `esbuild` added as a root devDependency (`pnpm add -w -D esbuild`)
- New `bundle` Nx target on `api`, `ai-worker`, `execution-worker` (`esbuild src/handler.ts --bundle --platform=node --target=node22 --format=cjs --outfile=dist-lambda/handler.js`). Separate from the existing `build` target (tsc/`nest build`, still used for typecheck/dev) — `bundle` is Lambda-packaging-only.
- `ai-worker`/`execution-worker` bundled cleanly with no extra flags.
- `api` needed a long `--external:` list for NestJS's lazy/optional `import()`s that esbuild can't resolve statically (none of these are actually used by this app — no microservices, websockets, GraphQL federation, or class-validator/class-transformer pipes): `@nestjs/microservices`, `@nestjs/websockets` (+ `/socket-module.js`), `@nestjs/microservices/microservices-module.js`, `class-transformer` (+ `/storage`), `class-validator`, `cache-manager`, `@apollo/gateway`, `@apollo/subgraph`, `ts-morph`, `@as-integrations/fastify`. Result: `handler.js` ~6.8MB, well under Lambda's zip limits.

**Fixed a real Lambda-breaking bug found while bundling `api`:** `app.module.ts` computed `autoSchemaFile` as a disk path via `fileURLToPath(new URL('../../../packages/graphql-contracts/schema.graphql', import.meta.url))`, run on every boot. Two problems in Lambda: `/var/task` is read-only (the write would throw), and esbuild's `cjs` output format makes `import.meta.url` an empty string, so `new URL()` throws before that. Fixed by branching on `process.env.AWS_LAMBDA_FUNCTION_NAME` (set automatically by the Lambda runtime): in Lambda, `autoSchemaFile: true` (in-memory schema generation, same resolvers → same schema, no file write); outside Lambda (`nest start`), unchanged — still writes `schema.graphql` for `graphql-contracts:codegen` to read.

**New Terraform files:**
- `dynamodb.tf` — `Workflows` (hash key `id`) and `Executions` (hash key `id`, GSIs `byWorkflowId` and `byStatus`) tables, `PAY_PER_REQUEST`. Shape copied exactly from `apps/api/scripts/create-tables.mjs` (the DynamoDB Local dev script) so app code behaves identically against either.
- `iam.tf` — one role per Lambda, least-privilege: `api` gets DynamoDB RW on both tables + SQS `SendMessage` on both queues; `ai-worker`/`execution-worker` each get `UpdateItem` on their one table + `ReceiveMessage`/`DeleteMessage`/`GetQueueAttributes` on their one queue. No IAM needed for AppSync Events publish — that's HTTP + API key, not IAM.
- `lambda.tf` — `archive_file` data sources zipping each app's `dist-lambda/handler.js`, the three `aws_lambda_function` resources (`nodejs22.x`, handler `handler.handler`), a `aws_cloudwatch_log_group` per function (14-day retention), and `aws_lambda_event_source_mapping` wiring `ai-worker`→`workflow_generation` queue and `execution-worker`→`workflow_execution` queue (batch size 1). Worker timeouts set to 50s (under the queues' 60s visibility timeout); `api`'s timeout set to 29s (under API Gateway HTTP API's 30s integration cap).
- `apigateway.tf` — `aws_apigatewayv2_api` (**HTTP API, not REST/v1** — `apps/api/src/handler.ts` is built against `@as-integrations/aws-lambda`'s `APIGatewayProxyEventV2` handler, which only a v2 HTTP API payload format matches), `$default` route + stage (`auto_deploy = true`), and the `aws_lambda_permission` letting API Gateway invoke it.
- `provider.tf` — added the `hashicorp/archive` provider (for `archive_file`).
- `variables.tf` — added `anthropic_api_key` (sensitive, no default — set via `TF_VAR_anthropic_api_key` or a gitignored `*.auto.tfvars`).
- `outputs.tf` — added `api_gateway_url`, `workflows_table_name`, `executions_table_name`.
- `.gitignore` — added `dist-lambda`, `.terraform`, `.terraform-build`, `*.tfstate*`, `*.auto.tfvars` (Terraform state/build artifacts and secrets must never be committed; `.terraform.lock.hcl` deliberately left trackable — that one *should* be committed for reproducible provider versions).

```
pnpm add -w -D esbuild
# added "bundle" target to apps/api, apps/ai-worker, apps/execution-worker project.json
pnpm nx run-many -t bundle -p api ai-worker execution-worker
```

Verified: all three `bundle` targets run clean (`NX Successfully ran target bundle for 3 projects`), confirmed each `dist-lambda/handler.js` exists and is non-trivial in size (api 6.8MB, ai-worker 2.8MB, execution-worker 1.3MB). Terraform files hand-reviewed for correctness — **no `terraform` CLI available in this environment**, so `terraform fmt`/`validate`/`plan` were not run here; the user should run those (and `terraform apply`, which provisions real, billable AWS resources and must never be run by the assistant) locally with their own Terraform install and AWS credentials.

**Follow-up: `project_name` default changed to `"nam"`** (explicit request — easy to spot own resources by prefix in the AWS console). This exposed two resources that weren't actually using `var.project_name` yet despite the rest already being prefixed: `dynamodb.tf`'s table names (were literal `"Workflows"`/`"Executions"`) and `appsync-events.tf`'s channel namespaces (were literal `"workflow-updates"`/`"execution-updates"`) — both now `"${var.project_name}-..."`. The DynamoDB rename was free (app code always reads the table name from `WORKFLOWS_TABLE_NAME`/`EXECUTIONS_TABLE_NAME` env vars, which Terraform already wires from the resource's actual `.name`). The channel namespace rename was not free — `ai-worker`/`execution-worker`'s `channelFor()` helpers build the AppSync Events channel path (`/{namespace}/{id}`) from a hardcoded namespace string, which would now mismatch the renamed Terraform resource. Fixed by reading the namespace from a new env var instead (`WORKFLOW_UPDATES_CHANNEL_NAMESPACE` / `EXECUTION_UPDATES_CHANNEL_NAMESPACE`, defaulting to the old unprefixed names for backward compatibility), wired in `lambda.tf` from `aws_appsync_channel_namespace.*.name`. Re-ran `bundle`/`build`/`lint` for all three apps after — clean.

Not committed — holding per standing instruction (ask before I commit/push).

## 27. Phase 6 — Actually deployed to real AWS; esbuild-for-api pivoted to `nest build` + `pnpm deploy`; AI provider switched to OpenAI

This entry covers everything from the actual first `terraform apply` through a verified live deployment. Unlike every prior phase, **this one was run against real AWS and confirmed working** (`curl` against the live API Gateway URL returns real GraphQL data).

**AWS provider version was wrong.** `aws_appsync_api`/`aws_appsync_channel_namespace` (AppSync Events resources) don't exist at all in `hashicorp/aws` v5.x — confirmed by `strings`-searching the installed v5.100.0 provider binary for `aws_appsync_*` resource names; they were added in v6. Bumped `provider.tf`'s constraint `~> 5.70` → `~> 6.0` (resolved to v6.73.0). That surfaced a second bug: `aws_appsync_api`'s nested auth blocks are singular (`auth_provider`, `connection_auth_mode`, `default_publish_auth_mode`, `default_subscribe_auth_mode`), not the plural names originally written — found via `terraform providers schema -json` dumped and walked with Python, not guessed.

**IAM permissions were incrementally insufficient** (expected for a scoped-down IAM user, not a bug) — `zaplite-main-developer` needed `IAMFullAccess`, `AmazonAPIGatewayAdministrator`, `AWSAppSyncAdministrator`, `CloudWatchLogsFullAccess` attached before `apply` could create IAM roles / API Gateway / AppSync / log groups. Attached via AWS console. Hit IAM's own eventual-consistency lag a few times after attaching (same action denied, then allowed seconds later on retry, confirmed independently via a direct `aws appsync list-api-keys` CLI call that succeeded right after a `terraform apply` failure on the identical call) — not a policy gap, just propagation; `terraform apply -refresh=false` sidestepped the flaky refresh reads once to get unblocked.

**AI provider switched from Anthropic to OpenAI**, at explicit request (user has an OpenAI API key, not an Anthropic Console one — Claude Pro / ChatGPT Plus subscriptions don't include API access, confirmed both are separate billing from their respective platform consoles). Changed `apps/ai-worker/src/services/workflow-generation.service.ts`'s `createChatModel('anthropic')` → `createChatModel('openai')` (the model-factory abstraction built in Phase 3 made this a one-line change). Terraform: `variables.tf`'s `anthropic_api_key` → `openai_api_key`; `lambda.tf`'s ai-worker env var `ANTHROPIC_API_KEY` → `OPENAI_API_KEY`.

**Resource naming: `project_name` changed `"ai-workflow-automation"` → `"nam"`** at explicit request (prefix everything so resources are identifiable in the AWS console) — see Phase 6 entry above for the DynamoDB/channel-namespace follow-through this triggered.

**Found and fixed a real Lambda-breaking bug while first smoke-testing the deployed `api`:** `GET /` returned `{"message":"Internal Server Error"}`. `aws logs tail /aws/lambda/nam-api` showed a crash at cold-start: `TypeError: The argument 'filename' must be a file URL object... Received undefined`, inside `fdir` (a transitive dep of `tinyglobby`, used by `@nestjs/graphql`'s glob utility) calling `createRequire(import.meta.url)` at module-load time — unrelated to our own code, but esbuild's `cjs` output format makes `import.meta.url` empty, so this throws immediately, unconditionally, just from importing the module. Tried `--define:import.meta.url=__filename` as a targeted esbuild fix — built clean, and a local smoke test (`require()`ing the bundle directly, then invoking `handler()` with a synthetic API Gateway v2 event) got past that crash into a **second, more fundamental one**.

**That second bug was the real finding: esbuild cannot bundle this NestJS app at all, full stop.** `extractTypeIfArray`/`reflectTypeFromMetadata` (inside `@nestjs/graphql`'s GraphQL schema builder) crashed on `reflectedType[index]` where `reflectedType` was `undefined` — meaning `Reflect.getMetadata('design:paramtypes', ...)` returned nothing. Confirmed empirically, not guessed: wrote an isolated 5-line test file (`reflect-metadata` + a decorated class with a constructor param), bundled it with esbuild using the exact same flags as `api`, and `Reflect.getMetadata('design:paramtypes', ...)` came back `undefined` — then compiled the *identical* pattern with plain `tsc` and got the correct metadata back (`[WorkflowService]`, confirmed directly against `apps/api/dist/graphql/workflow/workflow.resolver.js` from the existing `nest build` output). **esbuild 0.28.2 does not emit `design:paramtypes` under any configuration tried** — this isn't a flag or syntax issue, it's a hard capability gap. Since NestJS's constructor-based DI and its GraphQL code-first schema builder both depend on this metadata, esbuild is fundamentally incompatible with bundling this app, independent of whatever `@Field`/`@Args` type-function annotations exist in the source (first found 5 implicit-type usages — `@Field()`, `@Field({ nullable: true })`, `@Args('prompt')`, `@Args('input')` across `execution.model.ts`, `workflow.model.ts`, `create-workflow.input.ts`, `workflow.resolver.ts` — and made them all explicit as a first attempt; that alone did not fix it, confirming the root cause was the metadata gap, not these specific annotations. Left the explicit annotations in — more correct regardless, matches the rest of the codebase's style).

**Pivoted `api`'s Lambda packaging** from esbuild to `nest build` (real `tsc` output, which correctly emits `design:paramtypes`) + `pnpm deploy --prod` (produces a real, non-symlinked, production-only `node_modules` for just the `api` package, workspace packages included via content-addressable copy rather than symlink). `ai-worker`/`execution-worker` were **not** changed — they're plain functions with no NestJS DI or GraphQL code-first schema building, so esbuild's gap doesn't apply to them; both were already confirmed working.

- `pnpm deploy` initially pulled in **513MB** — including `next`/`@next`/`react-dom` from the *workspace root's* `package.json`, because `pnpm deploy`'s default "legacy" implementation (triggered automatically since this workspace didn't have `inject-workspace-packages` set) doesn't correctly scope to just the target package under a shared lockfile. Fixed by adding `inject-workspace-packages=true` to the root `.npmrc` and re-running `pnpm install` once, then `pnpm --filter api deploy --prod <dir>` (not `--legacy`) — correctly scoped, size dropped to 169MB unzipped / 35MB zipped (comfortably under Lambda's 250MB unzipped and 50MB zipped-direct-upload limits).
- `apps/api/package.json` — added `"files": ["dist"]` so the deployed package only carries compiled output, not `src`/`test`.
- `apps/api/project.json`'s `bundle` target — now `pnpm --filter api exec nest build` → `rm -rf apps/api/dist-lambda-pkg` → `pnpm --filter api deploy --prod apps/api/dist-lambda-pkg` (3 sequential `nx:run-commands`, must run from the workspace root since `pnpm deploy` needs `--filter` to scope correctly under a shared lockfile — a bare `pnpm deploy` run from inside `apps/api` fails with `ERR_PNPM_NOTHING_TO_DEPLOY`). The target *name* (`bundle`) deliberately didn't change, so `pnpm run bundle:lambdas` (root script, `nx run-many -t bundle -p api ai-worker execution-worker`) still works uniformly across all three apps despite `api`'s underlying mechanism being completely different from the other two.
- `infra/terraform/lambda.tf` — `data.archive_file.api` switched from `source_file` (single esbuild bundle) to `source_dir` (zips the whole `dist-lambda-pkg/` directory, including `node_modules`). Verified Terraform's archive provider correctly dereferences pnpm's symlinked `node_modules` into real files in the zip (unzipped and inspected: `drwxr-xr-x`, not `lrwxr-xr-x`) — this was a real risk worth checking, not assumed. `aws_lambda_function.api`'s `handler` changed from `"handler.handler"` to `"dist/handler.handler"` (matches `nest build`'s output layout, `dist/handler.js` at the package root).
- `apps/api/src/app.module.ts` — the Lambda-vs-dev branch added in Phase 4 (`autoSchemaFile: isLambda ? true : schemaOutputPath`) needed no changes; it was already correct for this packaging approach too (the read-only-`/var/task` problem is independent of bundler choice).

**Verified against real AWS, not just locally:**
- Unzipped Terraform's actual generated `api.zip` and ran the handler directly (`require()` + synthetic API Gateway v2 event) before ever running `terraform apply` with the new packaging — confirmed `{"data":{"health":"ok"}}` comes back correctly, schema builds without error.
- After `terraform apply`, hit the **live** API Gateway URL directly: `curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/ -d '{"query":"{ health }"}'` → `{"data":{"health":"ok"}}`. This is the first point in the whole project where a deployed-to-AWS response was actually confirmed, not just planned/built.

```
# .npmrc: added inject-workspace-packages=true, then:
pnpm install
pnpm run bundle:lambdas
cd infra/terraform
terraform init -upgrade   # pulled aws provider v5 -> v6
terraform apply           # multiple rounds: IAM permission gaps, then propagation retries
curl -X POST <api_gateway_url>/ -d '{"query":"{ health }"}'
```

**Still not verified end-to-end:** the actual `generateWorkflow`/`executeWorkflow` mutations through to `ai-worker`/`execution-worker` and an AppSync Events push — only `{ health }` has been confirmed live so far. That's the next verification step, not yet done.

## 28. Terraform enterprise best practices: remote state + GitHub OIDC CI/CD

Requested as an explicit, incremental, phased task ("do not run terraform apply, migrate state, or modify existing AWS resources without my approval" — approval was given per-phase as each was explained). All of Phase 6's existing resources were preserved; nothing recreated or destroyed.

**Phase 1 — Remote state.**
- New `infra/terraform-bootstrap/` — a separate root module with its own local state (deliberate: the bucket that stores everyone else's state can't also manage its own backend config, so this one stays small and is applied by hand, rarely).
- Creates `nam-terraform-state-314146325814` (account-id-suffixed for global uniqueness): versioned, SSE-S3 encrypted, all public access blocked.
- Hit a real permission gap applying it: `zaplite-main-developer` had no S3 permissions at all — `AmazonS3FullAccess` attached, then it applied clean.
- Backed up the existing local state (`infra/terraform/terraform.tfstate`, 86KB, 32 resources) to `/tmp/terraform.tfstate.backup-before-migration` before touching anything.
- Added a `backend "s3"` block to `infra/terraform/provider.tf` — `use_lockfile = true` (Terraform 1.17's native S3 locking; no separate DynamoDB lock table needed, simpler than the classic S3+DynamoDB pattern).
- `terraform init -migrate-state -force-copy` — copied local state into S3. Verified byte-for-byte via `aws s3 ls` (same size as the local file) and `terraform plan` (0 real changes — the only 2 diffs shown were expected noise: the AppSync API key's `timeadd(timestamp(), ...)` recalculating every plan, and the dummy `openai_api_key` used for this verification-only plan, not drift).

**Phase 2 — GitHub Actions CI/CD.**
- Checked for an existing GitHub OIDC provider first (`aws iam list-open-id-connect-providers`) — one already existed in the account (from another project; OIDC providers are account-wide, not project-scoped, so this is fine to reuse). Referenced it via a `data` source in `infra/terraform-bootstrap/oidc.tf` rather than creating a duplicate (IAM only allows one per URL per account anyway).
- Two IAM roles, not one — a PR's `plan` runs with `ReadOnlyAccess` only (any PR, including from a fork, could otherwise mint write credentials just by opening one); only a push to `refs/heads/main` can assume the role with real write permissions (mirrors exactly what's attached to `zaplite-main-developer`: IAM, API Gateway, AppSync, CloudWatch Logs, Lambda, DynamoDB, SQS, plus explicit S3 access scoped to just the state bucket).
  - `github-terraform-plan` — trust condition: `repo:BabakKhajavi/next-apollo-monorepo:pull_request`
  - `github-terraform-apply` — trust condition: `repo:BabakKhajavi/next-apollo-monorepo:ref:refs/heads/main`
- Found and replaced a dead workflow: `.github/workflows/deploy-infra.yml` ran `pnpm --filter infra cdk deploy` — a leftover from before the Terraform pivot; no `infra` package with a `cdk` script has existed for phases. Deleted it rather than leaving a broken workflow alongside the new ones.
- New `.github/workflows/terraform-plan.yml` (PR, path-filtered to `infra/terraform/**`) — `fmt -check`, `validate`, `plan`, posts the plan as a PR comment via `actions/github-script`. Runs `pnpm run bundle:lambdas` first since `archive_file` resources read local `dist-lambda(-pkg)` directories that don't exist on a fresh checkout.
- New `.github/workflows/terraform-apply.yml` (push to `main`, same path filter) — `environment: production` gates it behind GitHub's required-reviewer approval (configured in repo settings, not from a file — manual step, see below).
- Both workflows: `concurrency: { group: terraform, cancel-in-progress: false }` so a plan and an apply (or two applies) can never race against the same state.
- `aws-actions/configure-aws-credentials@v4` assumes the respective role via OIDC — no static AWS keys stored in GitHub at all.

**Manual steps still required (GitHub UI, not doable from here — no `gh` CLI installed in this environment):**
1. Repo Settings → Secrets and variables → Actions → add `OPENAI_API_KEY` (used as `TF_VAR_openai_api_key` in both workflows).
2. Repo Settings → Environments → create `production`, add a required reviewer — without this, `terraform-apply.yml` runs unattended on every merge to `main` instead of pausing for approval.

```
# Phase 1
cd infra/terraform-bootstrap && terraform init && terraform apply
cp infra/terraform/terraform.tfstate /tmp/terraform.tfstate.backup-before-migration
# added backend "s3" {} block to infra/terraform/provider.tf
cd infra/terraform && terraform init -migrate-state -force-copy
terraform plan   # verify: 0 real changes

# Phase 2
# added oidc.tf to infra/terraform-bootstrap/, applied (11 resources)
rm .github/workflows/deploy-infra.yml   # dead CDK reference
# added .github/workflows/terraform-plan.yml, terraform-apply.yml
```

Not yet done at the time: Phase 3 (reusable modules, separating app-code deploy from infra `apply`) — picked up in the next entry below.

## 29. Phase 3 (deferred piece) — per-app code deploy pipeline, `staging` branch, real end-to-end AWS test, CI fixed

**Live end-to-end test against real AWS**: triggered `generateWorkflow` for real via `curl` against the deployed API Gateway URL. Hit a real bug: `ai-worker`'s OpenAI call failed — `400 Invalid schema for response_format 'extract': ... schema must have a 'type' key`, from `WorkflowDefinitionSchema`'s `config: z.record(z.string(), z.unknown())` fields. OpenAI's strict structured-output mode (the default for `withStructuredOutput` on OpenAI models) rejects open-ended key-value maps — Anthropic's structured output didn't have this restriction, so the bug was invisible until switching providers. Fixed generically in `packages/ai-helper/src/services/generate-structured.ts`: pass `{ strict: false }` to `withStructuredOutput` always (Anthropic/Gemini ignore the option, so it's safe across all three providers, not just a provider-specific branch).

**Decoupled Lambda code deploy from Terraform** (the deferred Phase 3 bullet): added `lifecycle { ignore_changes = [filename, source_code_hash] }` to all three `aws_lambda_function` resources in `lambda.tf`. Terraform now only owns the function's *shape* (IAM role, env vars, timeout/memory) — not its deployed code. Without this, a code-deploy pipeline and a later `terraform apply` would fight over `source_code_hash` (whichever ran last would silently revert the other's code).

**New narrow IAM role**: `github-lambda-deploy` (`infra/terraform-bootstrap/oidc.tf`) — only `lambda:UpdateFunctionCode`/`GetFunction`, scoped to exactly the 3 function ARNs (hardcoded by name, since this is a separate root module from the one that creates them). Deliberately narrower than `github-terraform-apply` — a code-only deploy shouldn't need IAM/API Gateway/AppSync/DynamoDB/SQS write access.

**One consolidated deploy pipeline, not three** — built `.github/workflows/deploy-api.yml` / `deploy-ai-worker.yml` / `deploy-execution-worker.yml` first (path-filtered per app), then replaced all three with a single `.github/workflows/deploy-backend.yml` using real `nx affected` detection instead of hand-maintained path filters, per explicit request ("pipelines should be based on packages"). Two jobs:
- `detect` — `pnpm nx show projects --affected --base=<prev-commit> --head=HEAD -t bundle --json` → JSON array of which of `api`/`ai-worker`/`execution-worker` actually changed. Falls back to `HEAD~1` when `github.event.before` is all-zeros (first push to a new branch) or absent (`workflow_dispatch`). A `force_all` manual-dispatch input bypasses detection entirely.
- `deploy` — matrixed over the detected array; for each app: `nx run-many -t lint build`, `nx run <app>:bundle`, zip (api's directory-based `dist-lambda-pkg/`, or the single `handler.js` for the two esbuild workers), `aws lambda update-function-code`.

Triggers on push to `main` **or `staging`**, plus `workflow_dispatch` (explicit ask: "manual run option").

**`staging` branch** — created from `main`, pushed. Explicit decision (asked via AskUserQuestion, not assumed): staging deploys to the *same* AWS resources as `main` (no separate environment/state) — a pre-main integration branch, not environment isolation. Revisit if real staging isolation is ever needed (would mean a second Terraform state key + `nam-staging-*` naming + a third OIDC trust condition).

**Found and fixed CI, which had failed on every single run since the first commit** — not a version-mismatch issue as initially suspected, but a genuine pre-existing lint error in `apps/web` that nothing had ever run against (this session only ever ran scoped lints like `-p api ai-helper ...`, never the unscoped `nx run-many -t lint test build` that `ci.yml` actually runs). Reproduced locally by switching to Node 20 via `nvm` (matching `ci.yml`'s `node-version: 20`) and running the exact CI command — confirmed the failure wasn't Node-version-related (same failure persisted after fixing, independent of Node 20 vs 22). Root cause: `apps/web/apollo-client.d.ts`'s `export interface TypeOverrides extends GraphQLCodegenDataMasking.TypeOverrides {}` trips `@typescript-eslint/no-empty-object-type` — but this is Apollo's own documented module-augmentation pattern for opting into data masking, not dead code, so fixed with a scoped `eslint-disable-next-line` rather than removing it. Two more warnings in `apps/web/src/app/(public)/demo/queries.ts` (`gql` tagged templates inside `if (false)`, a GraphQL Code Generator static-extraction pattern) are warnings, not errors — don't fail the build, left as-is. Verified clean: `nx run-many -t lint test build` → 15/15 succeeded on Node 20.

**Checked for and found no `GITHUB_TOKEN`/credential access** — needed `gh` CLI to inspect the failing CI run's logs; it wasn't installed (`brew install gh`), and once installed wasn't authenticated. Fetched the failure via the public GitHub REST API instead (`api.github.com/repos/.../actions/runs/.../jobs`, no auth needed for a public repo's job/step metadata) to find which step failed, then reproduced the actual failure locally rather than trying to pull the full log (which does require auth even for public repos).

```
# OpenAI structured-output fix
# edited packages/ai-helper/src/services/generate-structured.ts
pnpm nx run ai-worker:bundle

# Lambda code/infra decoupling
# added lifecycle.ignore_changes to all 3 aws_lambda_function resources
# added github_lambda_deploy role + policy to infra/terraform-bootstrap/oidc.tf
cd infra/terraform-bootstrap && terraform apply   # +2 resources

# Consolidated deploy pipeline
rm .github/workflows/deploy-api.yml .github/workflows/deploy-ai-worker.yml .github/workflows/deploy-execution-worker.yml
# added .github/workflows/deploy-backend.yml

git branch staging main && git push -u origin staging

# CI fix
nvm install 20 && nvm use 20
pnpm nx run-many -t lint test build   # reproduced the web:lint failure
# edited apps/web/apollo-client.d.ts (scoped eslint-disable)
pnpm nx run-many -t lint test build   # 15/15 succeeded
nvm use 22
```

Verified: `generateWorkflow` mutation confirmed live end-to-end up through the OpenAI call succeeding (the fix); full `ai-worker` → DynamoDB write → AppSync push not yet re-verified after the fix (next step). `deploy-backend.yml` not yet run for real (needs a push to `staging` or `main` touching one of the 3 apps, or a manual dispatch). `github-lambda-deploy` role applied by the user (blocked for me by the harness's destructive-action classifier on `terraform apply`, same as before). CI fix verified locally on Node 20 matching `ci.yml` exactly; not yet confirmed green on GitHub itself (needs a push).

## 30. Frontend architecture — Phases 2-4 (GraphQL/Apollo data layer, real-time, design system + performance)

Explicit architecture decision from the user up front: Next.js App Router + RSC-first, Apollo Client in `packages/apollo-client` (request-scoped RSC instances, hooks for Client Components, normalized caching + SSR hydration, AppSync real-time), GraphQL Code Generator as the single typed source, a real `packages/design-system` with Tailwind + Storybook, Suspense/streaming/dynamic-import/image-font performance work targeting Lighthouse 90+, and (deferred — see below) AWS deployment via ECS Fargate + CloudFront + S3, with CI/CD kept separate from the Terraform plan/apply workflows. Explicitly no custom domain for this demo — works directly against the API Gateway and AppSync Events URLs. Phase 1 (removing the Countries-API starter/demo, adding `loading.tsx`/`error.tsx`, `.env.example`) had already landed on `staging` from separate work before this entry; Phases 2-4 were implemented inline in this session, continuously, per explicit instruction not to pause between them.

**Phase 2 — GraphQL/Apollo data layer.** `packages/graphql-contracts` was already the intended single codegen source (confirmed by reading `apps/web/src/app/page.tsx`, which already imported `WorkflowsDocument` from it) — extended its `.graphql` operation files rather than reviving `apps/web`'s own deleted `codegen.ts`:
- `operations/workflow.graphql` — added pagination args to `Workflows`, a `Workflow(id)` query, and `GenerateWorkflow`/`ApproveWorkflow`/`DeleteWorkflow`/`ExecuteWorkflow` mutations.
- `operations/execution.graphql` (new) — `Executions(workflowId, first, after)` and `Execution(id)`.
- `operations/dashboard.graphql` (new) — `DashboardStats`.
- `packages/apollo-client/src/cache/policies/index.ts` — removed the dead `Country`/`Continent` demo type policies, added a `cursorPagination()` field policy for `Query.workflows`/`Query.executions` (the backend's `{ items, nextCursor }` shape doesn't match `relayStylePagination`'s edges/pageInfo expectation, so this is a small custom merge function instead).

Real pages built against this: `/` (dashboard, `dashboardStats`), `/workflows` (list + a `GenerateWorkflowForm` Client Component), `/workflows/[id]` (detail — see Phase 3, this is where streaming + real-time converge).

**Found and fixed a real gap while building this:** `apps/web/src/app/layout.tsx` never mounted `<ApolloProvider>` — any Client Component calling `useSuspenseQuery`/`useMutation` would have thrown (no Apollo context). Added it, wrapping `{children}`.

**Found and fixed a TypeScript gap:** the generated `WorkflowStatus`/`ExecutionStatus` are real TS `enum`s (PascalCase members like `WorkflowStatus.Active`, string-valued `'ACTIVE'`), not string-literal unions. A `switch` with `case "ACTIVE":` type-checks fine (TS allows comparing a string enum to its matching literal) but doesn't let the compiler prove exhaustiveness — `status-tone.ts`'s mapping functions failed `next build`'s typecheck ("Function lacks ending return statement") until rewritten to switch on the enum members themselves (`WorkflowStatus.Active`), which does let TS verify every case is handled.

**Phase 3 — Real-time (AppSync Events, not GraphQL subscriptions).** The backend schema has no `Subscription` type — `ai-worker`/`execution-worker` push updates over AppSync Events (a separate pub/sub protocol, already used server-side via `packages/realtime`'s `publishEvent`). No published browser client exists for this specific protocol outside the much heavier `aws-amplify` package, so this was hand-implemented in `packages/apollo-client/src/realtime/` — but **verified against the real deployed AppSync Events API via a standalone Node script before writing a line of React**, not guessed:
- First attempt (auth via `?header=&payload=` query params, like classic AppSync GraphQL realtime subscriptions) failed: `"Required headers are missing."`
- Found the actual protocol by reading `@aws-amplify/api-graphql`'s `AWSAppSyncEventsProvider`/`AWSWebSocketProvider` source directly (installed `aws-amplify` into a scratch dir purely to read its source, not to depend on it) — the real differences: auth travels in the **WebSocket subprotocol list** (`new WebSocket(url, ["aws-appsync-event-ws", "header-<base64url>"])`), not a query string, and the auth header needs an `x-amz-date` field that was missing. Fixed both, re-ran the Node script against the live API: connect → `connection_init`/`connection_ack` → `subscribe`/`subscribe_success` → published a test event over the existing HTTP publish API → received it over the WebSocket as a `data` message. Confirmed end-to-end before building the React layer on top.
- `packages/apollo-client/src/realtime/appsync-events-client.ts` — `AppSyncEventsClient` class: connect, subscribe/unsubscribe, exponential-backoff reconnect that re-subscribes all active channels once reconnected.
- `packages/apollo-client/src/realtime/use-appsync-events.ts` — `useAppSyncEventsSubscription` hook, cleans up on unmount/channel change.
- New `./realtime` export subpath on `@monorepo/apollo-client`.
- `apps/web/src/features/workflows/realtime.ts` — app-specific singleton client + typed `WorkflowUpdateEvent`/`ExecutionUpdateEvent` (mirroring exactly what `ai-worker`/`execution-worker` publish) + channel-name helpers reading `NEXT_PUBLIC_WORKFLOW_UPDATES_CHANNEL_NAMESPACE`/`NEXT_PUBLIC_EXECUTION_UPDATES_CHANNEL_NAMESPACE` (must match the deployed `aws_appsync_channel_namespace` Terraform resources' actual prefixed names, not a hardcoded guess).
- `apps/web/src/features/workflows/useLiveUpdates.ts` — `useWorkflowLiveUpdates`/`useExecutionLiveUpdates`: subscribe, then `client.cache.modify()` directly on the normalized `Workflow`/`Execution` entity by id. This is the actual "no polling" mechanism — any component reading that entity's fields (via `useSuspenseQuery`) re-renders automatically when the cache entry changes, no refetch involved.
- This forced a related refactor: the workflow status/definition display had to become reactive, which meant it couldn't stay server-rendered. `WorkflowHeader.tsx` (new Client Component) now owns the `Workflow` query itself via `useSuspenseQuery` + calls `useWorkflowLiveUpdates`; `/workflows/[id]/page.tsx` shrank to just two `PreloadQuery`+`Suspense` blocks (workflow header, executions list) — same streaming pattern on both. `ExecutionsList` similarly split out a per-row `ExecutionRow` component (hooks can't run inside `.map()`) so each visible execution gets its own live subscription.
- `ApproveButton`/`ExecuteButton` simplified: no `router.refresh()` needed anymore — `ApproveWorkflow`'s mutation response (`{ id, status }`) normalizes automatically into the same cache entry `WorkflowHeader` reads. `ExecuteButton` keeps exactly one `refetchQueries` call (a brand-new `Execution` isn't in the cached list yet, so it needs one fetch to appear) — after that, its own live subscription carries every further status change.

**Phase 4 — Design system + performance.** `packages/design-system` had Storybook config already scaffolded but genuinely nothing installed (`.storybook/main.ts` referenced `@storybook/react-vite`, which wasn't a dependency anywhere) and zero components. Built real, reusable ones (not stubs): `Badge` (status pill, 5 tones) and `Button` (3 variants), each with Storybook stories, both actually used across every page (`status-tone.ts` maps the backend's `WorkflowStatus`/`ExecutionStatus` enums to `BadgeTone`).
- **`@storybook/addon-essentials` is incompatible with Storybook 10** (resolved version) — it's deprecated/merged into core as of Storybook 9+; removed it rather than pinning an old Storybook major to keep it.
- **`@nx/storybook@24.0.5` ships empty executors** (`{"executors": {}}`) — `@nx/storybook:storybook`/`:build` don't exist in this version. Switched `design-system/project.json`'s `storybook`/`build-storybook` targets to call the `storybook` CLI directly via `nx:run-commands` instead of guessing at a different plugin version. Removed the now-unused `@nx/storybook` dependency entirely.
- Verified: `nx run design-system:build-storybook` produces real static output (`dist/storybook/design-system/index.html` etc.), not a silent no-op.
- Suspense/streaming (the performance-relevant piece of Phase 4) is the same `PreloadQuery`+`useSuspenseQuery` mechanism built for Phase 3's real-time requirement — one implementation serving both requirements, not two.

**Verified against the real deployed backend, not just built locally** — curled the running dev server (pointed at the real API Gateway URL) for all three routes: `/` showed real counts (6 workflows, 1 execution, 1 SUCCEEDED), `/workflows` listed the actual workflow IDs generated earlier this session, `/workflows/01M7GGH2SS223GFWQF26F353MY` showed `ACTIVE` status, the `Execute` button, the real `httpRequest` definition, and the `SUCCEEDED` execution from earlier testing.

**Not verified — no browser available in this environment session** (the browser tool disconnected mid-session): the actual AppSync Events subscription wiring in the browser (`AppSyncEventsClient` + the React hooks). The wire protocol itself is verified for real (see above); what's unverified is specifically the React/Apollo integration layer on top of it — needs a real browser to confirm cache.modify-triggered re-renders actually happen live. Also not done: full Lighthouse pass, image/font optimization beyond what Next.js already does by default, dynamic imports (no obvious code-split candidate yet at this page count), and Phase 5/6 (ECS Fargate infra, app CI/CD) — explicitly deferred, not started.

```
pnpm add -w -D @nx/storybook storybook @storybook/react-vite @storybook/addon-essentials
pnpm remove -w @storybook/addon-essentials @nx/storybook   # incompatible / non-functional
pnpm nx run graphql-contracts:codegen
pnpm nx run design-system:build-storybook
pnpm nx run-many -t build lint -p web apollo-client graphql-contracts design-system
```
