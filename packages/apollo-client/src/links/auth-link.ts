import { SetContextLink } from "@apollo/client/link/context";

export type GetToken = () => string | null | Promise<string | null>;

/**
 * Takes an injected token getter rather than importing @monorepo/auth
 * directly — keeps this package decoupled from a specific auth
 * implementation. Consumers supply their own getToken.
 */
export function createAuthLink(getToken: GetToken): SetContextLink {
  return new SetContextLink(async (prevContext) => {
    const token = await getToken();

    return {
      headers: {
        ...prevContext.headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });
}
