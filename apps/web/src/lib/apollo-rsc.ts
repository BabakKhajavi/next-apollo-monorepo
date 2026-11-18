import { createRSCClient } from "@monorepo/apollo-client/nextjs";

export const { getClient, query, PreloadQuery } = createRSCClient({
  uri: process.env.GRAPHQL_URI ?? "http://localhost:4000/graphql",
});
