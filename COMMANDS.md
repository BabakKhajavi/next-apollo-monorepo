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
