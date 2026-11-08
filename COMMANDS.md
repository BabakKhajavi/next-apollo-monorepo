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
