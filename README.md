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
│   │       │                   #   enqueues generation requests here
│   │       ├── common/         # Paginated() generic connection factory,
│   │       │                   #   cursor encode/decode (opaque base64 of
│   │       │                   #   DynamoDB's LastEvaluatedKey)
│   │       ├── app.module.ts   # GraphQLModule.forRoot, autoSchemaFile
│   │       ├── main.ts         # Dev entry (Express HTTP listener)
│   │       └── handler.ts      # Prod Lambda entry (exports `handler`) — bare
│   │                            #   @apollo/server + @as-integrations/aws-lambda
│   │                            #   inline here; skips Nest's HTTP adapter at
│   │                            #   request time
│   │
│   └── ai-worker/              # SQS-triggered AI workflow generation worker
│       └── src/
│           ├── handler.ts      # Entry point — SQS event source mapping trigger
│           │                   #   (exports `handler`). Deploy-and-test only,
│           │                   #   no local runner.
│           ├── services/       # workflow-generation.service.ts (processMessage):
│           │                   #   @monorepo/ai-helper structured generation ->
│           │                   #   DynamoDB update -> AppSync Events publish
│           ├── types/          # WorkflowGenerationMessage
│           ├── repositories/   # Narrow, self-contained Workflows table update
│           │                   #   (not shared with apps/api — apps can't
│           │                   #   depend on each other in this workspace)
│           └── realtime/       # AppSync Events config + per-workflow channel naming
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
│   ├── stacks/                  # AWS CDK (stubs — superseded by infra/terraform)
│   └── terraform/               # Real infra, pulled forward from Phase 6 for Phase 3:
│                                 #   SQS (workflow-generation queue + DLQ), AppSync
│                                 #   Events API (API_KEY auth, workflow-updates channel
│                                 #   namespace). `terraform apply` provisions real,
│                                 #   billable AWS resources — run manually, not from here.
│
├── docker-compose.yml          # DynamoDB Local for dev (apps/api)
│
├── tools/                      # Nx generators and scripts
│
├── .github/                    # CI/CD workflows
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
