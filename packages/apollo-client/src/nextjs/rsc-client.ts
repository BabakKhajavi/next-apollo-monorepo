import { from } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { createCache } from "../cache/index";
import { createHttpLink, type CreateHttpLinkOptions } from "../links/http-link";
import { createAuthLink, type GetToken } from "../links/auth-link";

export interface CreateRSCClientOptions {
  uri: string;
  fetchOptions?: CreateHttpLinkOptions["fetchOptions"];
  /**
   * The factory below runs fresh per request (that's the whole point of
   * registerApolloClient), so reading the current request's auth state
   * here — e.g. via next/headers' cookies()/headers() — is safe and is
   * NOT shared across requests.
   */
  getToken?: GetToken;
}

/**
 * Call once per app, at module scope, in the app's own file — this is a
 * singleton per request context, not something a shared package should
 * own an instance of.
 */
export function createRSCClient({
  uri,
  fetchOptions,
  getToken,
}: CreateRSCClientOptions) {
  return registerApolloClient(() => {
    const authLink = createAuthLink(getToken ?? (() => null));
    const httpLink = createHttpLink({ uri, fetchOptions });

    return new ApolloClient({
      cache: createCache({ InMemoryCacheClass: InMemoryCache }),
      link: from([authLink, httpLink]),
      dataMasking: true,
    });
  });
}
