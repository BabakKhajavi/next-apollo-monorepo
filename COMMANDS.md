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
