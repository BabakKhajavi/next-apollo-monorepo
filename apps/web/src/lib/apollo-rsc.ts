import { createRSCClient } from "@monorepo/apollo-client/nextjs";

export const { getClient, query, PreloadQuery } = createRSCClient({
  uri: process.env.GRAPHQL_URI ?? "https://countries.trevorblades.com/graphql",
});
