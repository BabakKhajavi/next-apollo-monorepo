## Enterprise Next.js + NestJS + Apollo Monorepo

Technology: Nx + pnpm + Next.js + NestJS + Apollo GraphQL + LangChain + AWS

- One Next.js application and one NestJS API.
- Application-specific features remain inside their applications.
- Reusable packages are independently managed and npm-ready.
- Atomic Design and Storybook live together.
- Apollo Client is a separate package; server-side Apollo lives directly in `apps/api` (single consumer, no standalone package).
- AppSync Events handles real-time communication.
- `web` is hosted on ECS Fargate (standalone Next.js server, Dockerfile at `apps/web/Dockerfile`) behind CloudFront + S3 for static assets — deliberately not serverless like the rest of the backend: a `min 1` Fargate task gives deterministic per-request latency for SSR/RSC, which matters more here than the backend's scale-to-zero cost savings. See `infra/terraform-web/`.
- Architecture/pipeline diagrams (standalone HTML, open directly in a browser) live in `docs/diagrams/`.

```
next-apollo-monorepo/
│
├── apps/
│   ├── web/                    # Next.js App Router — demo UI for the backend
│   │   └── src/
│   │       ├── app/            # /, /workflows, /workflows/[id] — RSC pages,
│   │       │                   #   PreloadQuery+useSuspenseQuery for streamed
│   │       │                   #   Client Component sections (Suspense)
│   │       ├── features/       # workflows/: GenerateWorkflowForm, Approve/
│   │       │                   #   ExecuteButton, WorkflowHeader, ExecutionsList
│   │       │                   #   (all live-updated via AppSync Events ->
│   │       │                   #   Apollo cache.modify, no polling), status-tone
│   │       │                   #   mapping, realtime.ts (channel names + typed
│   │       │                   #   event payloads)
│   │       ├── providers/      # ApolloProvider (browser, mounted in layout.tsx)
│   │       └── lib/            # apollo-rsc.ts (RSC-scoped client)
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
│   ├── design-system/          # Badge, Button (real components, not stubs) +
│   │                           #   Storybook (storybook CLI directly via
│   │                           #   nx:run-commands — @nx/storybook 24.0.5 ships
│   │                           #   no working executors)
│   ├── apollo-client/          # Apollo Client + Next.js SSR; ./realtime subpath
│   │                           #   is a hand-rolled AppSync Events browser client
│   │                           #   (no published client library exists outside
│   │                           #   the much heavier aws-amplify) — wire protocol
│   │                           #   verified against the real deployed API before
│   │                           #   being wired into React
│   ├── graphql-contracts/      # Generated schema.graphql + typed operations
│   │                           #   (GraphQL Code Generator, TypedDocumentNode) —
│   │                           #   single codegen source for apps/web too, no
│   │                           #   separate per-app codegen config
│   ├── ai-helper/              # LangChain model factory (createChatModel: anthropic/
│   │                           #   openai/gemini) + generateStructured() Zod helper —
│   │                           #   provider-agnostic, reusable by any future AI feature
│   ├── realtime/               # AppSync Events HTTP publish helper (publishEvent)
│   ├── auth/                   # Shared authentication
│   ├── shared/                 # Types, utils, validation
│   └── config/                 # Shared tooling configuration
│
├── infra/
│   ├── terraform-backend/       # Real infra, deployed and verified against real AWS —
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
│                                 #   execution-updates channel namespaces). `api`'s
│                                 #   Lambda also has a `live` alias with Provisioned
│                                 #   Concurrency (1 unit) — RSC pages call `api`
│                                 #   server-side on every render, so this alias (not
│                                 #   $LATEST) is what API Gateway's integration
│                                 #   targets, removing cold-start latency from that
│                                 #   path; deploy-backend.yml repoints it after every
│                                 #   `api` deploy. State is remote (S3, versioned +
│                                 #   encrypted + native locking) — see
│                                 #   infra/terraform-bootstrap/ below.
│   ├── terraform-web/           # Separate root module/state from infra/terraform-backend —
│                                 #   the `web` app's own hosting infra, applied
│                                 #   independently of the backend. VPC (public
│                                 #   subnets only, no NAT — Fargate tasks get a
│                                 #   public IP), ALB (HTTP, reachable only from
│                                 #   CloudFront's managed prefix list), ECS Fargate
│                                 #   cluster/service/task running the Next.js
│                                 #   standalone server (min 1 task — no scale-out
│                                 #   cold start — CPU-based autoscaling up to 3),
│                                 #   ECR repo for the image, S3 bucket + CloudFront
│                                 #   distribution (OAC, not legacy OAI) serving
│                                 #   `_next/static/*` with a 1yr TTL while the ALB
│                                 #   origin handles everything else (SSR/RSC,
│                                 #   uncached). No custom domain — CloudFront's
│                                 #   default `*.cloudfront.net` domain.
│   └── terraform-bootstrap/     # Separate root module, own local state (chicken-and-
│                                 #   egg: the state bucket can't manage its own
│                                 #   backend). Creates the S3 state bucket and the
│                                 #   GitHub OIDC IAM roles CI assumes — one set per
│                                 #   app (github-terraform-plan/-apply for the
│                                 #   backend, github-terraform-web-plan/-apply for
│                                 #   web, each read-only on PRs / full-write on push
│                                 #   to main only) plus the narrower app-deploy roles
│                                 #   (github-lambda-deploy, github-web-deploy).
│                                 #   Applied manually, rarely touched.
│
├── docker-compose.yml          # DynamoDB Local for dev (apps/api)
│
├── docs/
│   └── diagrams/                # Standalone HTML diagrams (architecture, pipelines) —
│                                 #   open directly in a browser, no build step
│
├── tools/                      # Nx generators and scripts
│
├── .github/                    # CI/CD workflows — ci.yml (lint/test/build on every
│                                 #   push/PR), terraform-plan.yml/terraform-apply.yml
│                                 #   (infra/terraform-backend/**, backend), terraform-web-plan.yml/
│                                 #   terraform-web-apply.yml (infra/terraform-web/**, web —
│                                 #   same shape, separate concurrency group, since the two
│                                 #   never share a state file), both apply workflows gated
│                                 #   behind the `production` GitHub Environment's required
│                                 #   reviewers. deploy-backend.yml (push to main or staging,
│                                 #   or manual dispatch — one `detect` job runs `nx show
│                                 #   projects --affected -t bundle` to find which of
│                                 #   api/ai-worker/execution-worker actually changed, a
│                                 #   matrixed `deploy` job then bundles + `aws lambda
│                                 #   update-function-code --publish` only those, and for
│                                 #   `api` specifically repoints its `live` alias at the
│                                 #   newly published version afterward; Terraform's Lambda
│                                 #   resources use `lifecycle.ignore_changes` on their code
│                                 #   so this pipeline and `terraform apply` don't fight over
│                                 #   source_code_hash). deploy-web.yml (push to main/staging —
│                                 #   nx build+lint, Docker build/push to ECR, register a new
│                                 #   ECS task-def revision, `update-service
│                                 #   --force-new-deployment` + wait for stability, sync
│                                 #   `.next/static`/`public` to the static S3 bucket,
│                                 #   CloudFront invalidation). release.yml. All
│                                 #   Terraform/deploy workflows assume an OIDC role each —
│                                 #   no static AWS keys in CI.
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

pnpm run tf:bootstrap:plan / :apply   # infra/terraform-bootstrap — state bucket + OIDC roles
pnpm run tf:backend:plan / :apply     # infra/terraform-backend — needs TF_VAR_openai_api_key set
pnpm run tf:web:plan / :apply         # infra/terraform-web — needs TF_VAR_graphql_uri set
```

The three Terraform roots are independent (no root reads another's state) — run them in any order. All three scripts pin `AWS_PROFILE=zaplite-dev`, since the shared-credentials-file's `default` profile isn't valid for this account (`terraform-backend`/`-web` need `TF_VAR_openai_api_key`/`TF_VAR_graphql_uri` exported first, or terraform prompts for them).

Versioning is **never automatic per commit** — it only runs when triggered. CI release (`.github/workflows/release.yml`) fires on manual `workflow_dispatch` or a push to `release/**`, not on every merge to `main`, so version tags stay frozen during normal development and only move at an explicit promotion point.

## Skills

- `apollo-client` (`.agents/skills/apollo-client`) — Apollo's official best-practices skill, installed via `npx skills add apollographql/skills --skill apollo-client`. Loaded automatically when working with Apollo Client code.

See [COMMANDS.md](COMMANDS.md) for the full chronological setup log.
