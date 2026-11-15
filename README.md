## Enterprise Next.js + NestJS + Apollo Monorepo

Technology: Nx + pnpm + Next.js + NestJS + Apollo GraphQL + LangChain + AWS

- One Next.js application and one NestJS API.
- Application-specific features remain inside their applications.
- Reusable packages are independently managed and npm-ready.
- Atomic Design and Storybook live together.
- Apollo Client is a separate package; server-side Apollo lives directly in `apps/api` (single consumer, no standalone package).
- AppSync Events handles real-time communication.

```
next-apollo-monorepo/
│
├── apps/
│   ├── web/                    # Next.js App Router
│   │   └── src/
│   │       ├── app/
│   │       ├── features/
│   │       ├── providers/
│   │       └── lib/
│   │
│   ├── api/                    # NestJS + Apollo Server 5 (code-first GraphQL)
│   │   └── src/
│   │       ├── graphql/        # One module per domain (workflow/, execution/,
│   │       │                   #   dashboard/): model, repository, service,
│   │       │                   #   resolver, module — each a feature module
│   │       │                   #   imported into AppModule, own DI graph
│   │       ├── dynamodb/       # DynamoDBDocumentClient provider (DynamoDbModule,
│   │       │                   #   @Global), table/index name constants
│   │       ├── sqs/            # SQS client provider (SqsModule, @Global) +
│   │       │                   #   SqsService.sendMessage — workflow.service.ts
│   │       │                   #   enqueues generation requests, execution.service.ts
│   │       │                   #   enqueues execution requests
│   │       ├── common/         # Paginated() generic connection factory,
│   │       │                   #   cursor encode/decode (opaque base64 of
│   │       │                   #   DynamoDB's LastEvaluatedKey)
│   │       ├── app.module.ts   # GraphQLModule.forRoot, autoSchemaFile
│   │       ├── main.ts         # Dev entry (Express HTTP listener)
│   │       └── handler.ts      # Prod Lambda entry (exports `handler`) — bare
│   │                            #   @apollo/server + @as-integrations/aws-lambda
│   │                            #   inline here; skips Nest's HTTP adapter at
│   │                            #   request time. Deployed via the `bundle` Nx
│   │                            #   target: `nest build` (real tsc output —
│   │                            #   NestJS's GraphQL schema builder + constructor
│   │                            #   DI both need design:paramtypes, which esbuild
│   │                            #   never emits) + `pnpm deploy --prod` for a
│   │                            #   real, non-symlinked node_modules ->
│   │                            #   dist-lambda-pkg/. ai-worker/execution-worker
│   │                            #   stay on esbuild (plain functions, no Nest DI).
│   │
│   ├── ai-worker/              # SQS-triggered AI workflow generation worker
│   │   └── src/
│   │       ├── handler.ts      # Entry point — SQS event source mapping trigger
│   │       │                   #   (exports `handler`). Deploy-and-test only,
│   │       │                   #   no local runner.
│   │       ├── services/       # workflow-generation.service.ts (processMessage):
│   │       │                   #   @monorepo/ai-helper structured generation ->
│   │       │                   #   DynamoDB update -> AppSync Events publish
│   │       ├── types/          # WorkflowGenerationMessage
│   │       ├── repositories/   # Narrow, self-contained Workflows table update
│   │       │                   #   (not shared with apps/api — apps can't
│   │       │                   #   depend on each other in this workspace)
│   │       └── realtime/       # AppSync Events config + per-workflow channel naming
│   │
│   └── execution-worker/       # SQS-triggered workflow execution worker — same
│       └── src/                 #   shape as ai-worker (handler.ts, services/, types/,
│                                 #   repositories/, realtime/). Runs each action in
│                                 #   Workflow.definition.actions: httpRequest is
│                                 #   genuinely executed (real fetch); sendEmail/
│                                 #   runScript are structural stubs (log + succeed) —
│                                 #   no SES/sandboxed exec wired up for the demo.
│
├── packages/
│   ├── design-system/          # Atomic Design + Storybook
│   ├── apollo-client/          # Apollo Client + Next.js SSR
│   ├── graphql-contracts/      # Generated schema.graphql + typed operations
│   │                           #   (GraphQL Code Generator, TypedDocumentNode)
│   ├── ai-helper/              # LangChain model factory (createChatModel: anthropic/
│   │                           #   openai/gemini) + generateStructured() Zod helper —
│   │                           #   provider-agnostic, reusable by any future AI feature
│   ├── realtime/               # AppSync Events HTTP publish helper (publishEvent)
│   ├── auth/                   # Shared authentication
│   ├── shared/                 # Types, utils, validation
│   └── config/                 # Shared tooling configuration
│
├── infra/
│   ├── terraform/               # Real infra, deployed and verified against real AWS —
│                                 #   DynamoDB (nam-workflows, nam-executions + GSIs), 3
│                                 #   Lambdas (ai-worker/execution-worker esbuild-bundled
│                                 #   to dist-lambda/handler.js; api packaged via `nest
│                                 #   build` + `pnpm deploy --prod` to dist-lambda-pkg/ —
│                                 #   run `pnpm run bundle:lambdas` before apply), API
│                                 #   Gateway HTTP API fronting `api`, per-Lambda IAM
│                                 #   roles (all resources prefixed `nam-` via
│                                 #   var.project_name), SQS (workflow-generation +
│                                 #   workflow-execution queues + DLQs), AppSync Events
│                                 #   API (API_KEY auth, workflow-updates +
│                                 #   execution-updates channel namespaces). State is
│                                 #   remote (S3, versioned + encrypted + native
│                                 #   locking) — see infra/terraform-bootstrap/ below.
│   └── terraform-bootstrap/     # Separate root module, own local state (chicken-and-
│                                 #   egg: the state bucket can't manage its own
│                                 #   backend). Creates the S3 state bucket and the two
│                                 #   GitHub OIDC IAM roles CI assumes (github-terraform-
│                                 #   plan: read-only, any PR; github-terraform-apply:
│                                 #   full infra write, push-to-main only). Applied
│                                 #   manually, rarely touched.
│
├── docker-compose.yml          # DynamoDB Local for dev (apps/api)
│
├── tools/                      # Nx generators and scripts
│
├── .github/                    # CI/CD workflows — ci.yml (lint/test/build on every
│                                 #   push/PR), terraform-plan.yml (PR against
│                                 #   infra/terraform/**, posts plan as a PR comment),
│                                 #   terraform-apply.yml (push to main, gated behind
│                                 #   the `production` GitHub Environment's required
│                                 #   reviewers), deploy-backend.yml (push to main or
│                                 #   staging, or manual dispatch — one `detect` job
│                                 #   runs `nx show projects --affected -t bundle` to
│                                 #   find which of api/ai-worker/execution-worker
│                                 #   actually changed, a matrixed `deploy` job then
│                                 #   bundles + `aws lambda update-function-code` only
│                                 #   those; Terraform's Lambda resources use
│                                 #   `lifecycle.ignore_changes` on their code so this
│                                 #   pipeline and `terraform apply` don't fight over
│                                 #   source_code_hash), deploy-web.yml (build-only, not
│                                 #   wired to an actual deploy yet), release.yml. Both
│                                 #   Terraform workflows and deploy-backend.yml assume an
│                                 #   OIDC role — no static AWS keys in CI.
│
├── nx.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json


                      Nx + pnpm Monorepo
                              │
             ┌────────────────┴────────────────┐
             │                                 │
         Applications                       Packages
             │                                 │
       ┌─────┴─────┐          ┌────────────────┼────────────────┐
       │           │          │                │                │
    Next.js      NestJS    Design System    Apollo Client    AI Helper
       │           │          │                │                │
    Features    Modules    Storybook      GraphQL Cache     LangChain
       │           │                           │                │
       └─────┬─────┘                           │                │
             │                                 │                │
             └──────────── Shared Contracts ───┴────────────────┘


```

## Useful Commands

```
pnpm run dev:web          # run web dev server alone (separate terminal)
pnpm run dev:api          # run api dev server alone (separate terminal)
pnpm --filter api db:up             # start DynamoDB Local (docker-compose)
pnpm --filter api db:create-tables  # create Workflows/Executions tables + GSIs locally
pnpm --filter api db:seed           # seed sample workflows/executions
pnpm run preview:web      # production build + next start, for real Core Web Vitals testing
pnpm run graph            # visualize full project dependency graph
pnpm run show:web         # inspect web's targets/deps
pnpm run show:api         # inspect api's targets/deps
pnpm run affected:build   # build only projects changed vs. base branch
pnpm run affected:test    # test only affected projects
pnpm run affected:lint    # lint only affected projects
pnpm run affected:graph   # visualize only the affected projects vs. base branch
pnpm run affected:list    # plain text list of affected project names
pnpm run reset            # clear Nx cache/daemon when something looks stale
pnpm run release:dry      # preview version bumps/changelogs, no writes
pnpm run release          # bump versions, write changelogs, commit + tag (conventional commits, independent per-project)
```

Versioning is **never automatic per commit** — it only runs when triggered. CI release (`.github/workflows/release.yml`) fires on manual `workflow_dispatch` or a push to `release/**`, not on every merge to `main`, so version tags stay frozen during normal development and only move at an explicit promotion point.

## Skills

- `apollo-client` (`.agents/skills/apollo-client`) — Apollo's official best-practices skill, installed via `npx skills add apollographql/skills --skill apollo-client`. Loaded automatically when working with Apollo Client code.

See [COMMANDS.md](COMMANDS.md) for the full chronological setup log.
