"use client";

import type { PropsWithChildren } from "react";
import { ApolloWrapper } from "@monorepo/apollo-client/providers";

export function ApolloProvider({ children }: PropsWithChildren) {
  return (
    <ApolloWrapper
      uri={process.env.NEXT_PUBLIC_GRAPHQL_URI ?? "http://localhost:4000/graphql"}
      getToken={() => null /* TODO: wire to @monorepo/auth once implemented */}
    >
      {children}
    </ApolloWrapper>
  );
}
