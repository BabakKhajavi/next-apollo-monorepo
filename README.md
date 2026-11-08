next-apollo-monorepo/
│
├── apps/
│ │
│ ├── web/ # Next.js App Router
│ │ ├── src/
│ │ │ ├── app/
│ │ │ │ ├── (public)/
│ │ │ │ │ ├── login/
│ │ │ │ │ └── register/
│ │ │ │ │
│ │ │ │ ├── (protected)/
│ │ │ │ │ ├── dashboard/
│ │ │ │ │ ├── users/
│ │ │ │ │ └── products/
│ │ │ │ │
│ │ │ │ ├── layout.tsx
│ │ │ │ └── page.tsx
│ │ │ │
│ │ │ ├── features/ # Application-specific domains
│ │ │ │ ├── auth/
│ │ │ │ │ ├── components/
│ │ │ │ │ ├── hooks/
│ │ │ │ │ └── utils/
│ │ │ │ │
│ │ │ │ ├── users/
│ │ │ │ │ ├── components/
│ │ │ │ │ ├── hooks/
│ │ │ │ │ ├── graphql/
│ │ │ │ │ │ ├── queries/
│ │ │ │ │ │ ├── mutations/
│ │ │ │ │ │ ├── fragments/
│ │ │ │ │ │ └── generated/
│ │ │ │ │ ├── types/
│ │ │ │ │ └── index.ts
│ │ │ │ │
│ │ │ │ ├── dashboard/
│ │ │ │ └── products/
│ │ │ │
│ │ │ ├── providers/ # App providers
│ │ │ ├── lib/ # App-specific utilities
│ │ │ └── instrumentation.ts
│ │ │
│ │ ├── public/
│ │ ├── next.config.ts
│ │ ├── project.json
│ │ ├── tsconfig.json
│ │ └── package.json
│ │
│ │
│ └── api/ # NestJS + Apollo Server
│ ├── src/
│ │ ├── modules/
│ │ │ ├── auth/
│ │ │ ├── users/
│ │ │ │ ├── application/ # Use cases
│ │ │ │ ├── domain/ # Business logic
│ │ │ │ ├── infrastructure/ # Repositories
│ │ │ │ └── presentation/ # GraphQL resolvers
│ │ │ └── products/
│ │ │
│ │ ├── common/
│ │ │ ├── guards/
│ │ │ ├── filters/
│ │ │ └── interceptors/
│ │ │
│ │ ├── config/
│ │ ├── app.module.ts
│ │ ├── main.ts
│ │ └── lambda.ts
│ │
│ ├── project.json
│ ├── tsconfig.json
│ └── package.json
│
│
├── packages/
│ │
│ ├── design-system/ # Atomic Design + Storybook
│ │ ├── .storybook/
│ │ │ ├── main.ts
│ │ │ └── preview.ts
│ │ │
│ │ ├── src/
│ │ │ ├── atoms/
│ │ │ ├── molecules/
│ │ │ ├── organisms/
│ │ │ ├── templates/
│ │ │ ├── theme/
│ │ │ ├── tokens/
│ │ │ ├── hooks/
│ │ │ └── index.ts
│ │ │
│ │ ├── project.json
│ │ ├── package.json
│ │ └── tsconfig.json
│ │
│ ├── apollo-client/ # Apollo Client 4
│ │ ├── src/
│ │ │ ├── cache/
│ │ │ │ ├── policies/
│ │ │ │ └── pagination/
│ │ │ ├── links/
│ │ │ │ ├── auth-link.ts
│ │ │ │ ├── error-link.ts
│ │ │ │ └── http-link.ts
│ │ │ ├── providers/
│ │ │ ├── nextjs/ # SSR / RSC integration
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── apollo-server/ # Apollo Server 5 utilities
│ │ ├── src/
│ │ │ ├── plugins/
│ │ │ ├── context/
│ │ │ ├── errors/
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── graphql-contracts/ # Shared GraphQL contracts
│ │ ├── src/
│ │ │ ├── schema/
│ │ │ ├── scalars/
│ │ │ ├── generated/
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── ai-helper/ # LangChain AI Factory
│ │ ├── src/
│ │ │ ├── providers/
│ │ │ │ ├── openai.ts
│ │ │ │ ├── anthropic.ts
│ │ │ │ └── gemini.ts
│ │ │ ├── factory/
│ │ │ ├── schemas/
│ │ │ ├── prompts/
│ │ │ ├── chains/
│ │ │ ├── parsers/
│ │ │ ├── errors/
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── realtime/ # AWS AppSync Events
│ │ ├── src/
│ │ │ ├── client/
│ │ │ ├── publisher/
│ │ │ ├── channels/
│ │ │ ├── handlers/
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── auth/ # Shared auth utilities
│ │ ├── src/
│ │ │ ├── client/
│ │ │ ├── server/
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── shared/
│ │ ├── types/
│ │ ├── utils/
│ │ ├── constants/
│ │ └── validation/
│ │
│ └── config/
│ ├── eslint/
│ ├── typescript/
│ └── testing/
│
│
├── infra/ # AWS CDK
│ ├── bin/
│ ├── stacks/
│ │ ├── network-stack.ts
│ │ ├── frontend-stack.ts
│ │ ├── api-stack.ts
│ │ ├── realtime-stack.ts
│ │ ├── database-stack.ts
│ │ └── observability-stack.ts
│ │
│ └── constructs/
│
├── tools/
│ ├── generators/ # Nx custom generators
│ └── scripts/
│
├── .github/
│ └── workflows/
│ ├── ci.yml
│ ├── deploy-web.yml
│ ├── deploy-api.yml
│ └── deploy-infra.yml
│
├── nx.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── eslint.config.mjs
├── .npmrc
├── .gitignore
└── package.json
