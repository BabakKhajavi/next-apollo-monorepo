import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output so the Docker image only needs .next/standalone +
  // .next/static + public, not the full monorepo node_modules tree.
  output: "standalone",
  transpilePackages: [
    "@monorepo/apollo-client",
    "@monorepo/design-system",
    "@monorepo/graphql-contracts",
    "@monorepo/auth",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
