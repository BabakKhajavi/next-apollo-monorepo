# Multi-stage build for the `web` Next.js app (standalone output), run from
# the monorepo root: `docker build -f apps/web/Dockerfile .`
#
# NEXT_PUBLIC_* vars get bundled into client JS, so they must be present as
# build args. The bare GRAPHQL_URI (server-only, read at request time by RSC)
# is intentionally NOT a build arg — it's injected as an ECS task-def env var
# at runtime instead, so it can change without a rebuild.

FROM node:22-slim AS builder
WORKDIR /repo

RUN corepack enable

# pnpm's injectWorkspacePackages lockfile check wants every workspace
# project's package.json present, not just this app's — a partial COPY
# for layer caching trips ERR_PNPM_LOCKFILE_CONFIG_MISMATCH. Copy
# everything up front instead; .dockerignore keeps node_modules/.next/
# etc out of the build context.
COPY . .

RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_GRAPHQL_URI
ARG NEXT_PUBLIC_APPSYNC_EVENTS_HTTP_ENDPOINT
ARG NEXT_PUBLIC_APPSYNC_EVENTS_API_KEY
ARG NEXT_PUBLIC_WORKFLOW_UPDATES_CHANNEL_NAMESPACE
ARG NEXT_PUBLIC_EXECUTION_UPDATES_CHANNEL_NAMESPACE
ENV NEXT_PUBLIC_GRAPHQL_URI=${NEXT_PUBLIC_GRAPHQL_URI} \
    NEXT_PUBLIC_APPSYNC_EVENTS_HTTP_ENDPOINT=${NEXT_PUBLIC_APPSYNC_EVENTS_HTTP_ENDPOINT} \
    NEXT_PUBLIC_APPSYNC_EVENTS_API_KEY=${NEXT_PUBLIC_APPSYNC_EVENTS_API_KEY} \
    NEXT_PUBLIC_WORKFLOW_UPDATES_CHANNEL_NAMESPACE=${NEXT_PUBLIC_WORKFLOW_UPDATES_CHANNEL_NAMESPACE} \
    NEXT_PUBLIC_EXECUTION_UPDATES_CHANNEL_NAMESPACE=${NEXT_PUBLIC_EXECUTION_UPDATES_CHANNEL_NAMESPACE}

RUN pnpm nx build web

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
