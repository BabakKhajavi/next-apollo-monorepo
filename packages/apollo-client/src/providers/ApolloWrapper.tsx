"use client";

import type { PropsWithChildren } from "react";
import { from } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { createCache } from "../cache/index";
import { createHttpLink } from "../links/http-link";
import { createAuthLink, type GetToken } from "../links/auth-link";
import { createErrorLink, type OnApolloError } from "../links/error-link";

export interface ApolloWrapperProps {
  uri: string;
  getToken?: GetToken;
  onError?: OnApolloError;
}

export function ApolloWrapper({
  uri,
  getToken,
  onError,
  children,
}: PropsWithChildren<ApolloWrapperProps>) {
  function makeClient() {
    const errorLink = createErrorLink(onError);
    const authLink = createAuthLink(getToken ?? (() => null));
    const httpLink = createHttpLink({ uri });

    return new ApolloClient({
      cache: createCache({ InMemoryCacheClass: InMemoryCache }),
      link: from([errorLink, authLink, httpLink]),
      dataMasking: true,
    });
  }

  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
