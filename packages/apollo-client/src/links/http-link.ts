import { HttpLink } from "@apollo/client";

export interface CreateHttpLinkOptions {
  uri: string;
  fetchOptions?: HttpLink.Options["fetchOptions"];
}

/**
 * Defaults to `cache: "no-store"` — this link has no per-request knowledge
 * of who's asking, so letting Next.js persist responses across requests
 * would leak one user's data into another's. Pass `fetchOptions` to opt a
 * specific, non-authenticated query back into Next's fetch cache.
 */
export function createHttpLink({ uri, fetchOptions }: CreateHttpLinkOptions): HttpLink {
  return new HttpLink({
    uri,
    fetchOptions: { cache: "no-store", ...fetchOptions },
  });
}
