import { ErrorLink } from "@apollo/client/link/error";
import {
  CombinedGraphQLErrors,
  ServerError,
  ServerParseError,
} from "@apollo/client/errors";
import type { ErrorLike } from "@apollo/client";

export type OnApolloError = (error: ErrorLike) => void;

export function createErrorLink(onError?: OnApolloError): ErrorLink {
  return new ErrorLink(({ error }) => {
    if (CombinedGraphQLErrors.is(error)) {
      for (const graphQLError of error.errors) {
        console.error(`[GraphQL error]: ${graphQLError.message}`);
      }
    } else if (ServerError.is(error)) {
      console.error(`[Server error]: ${error.statusCode}`);
    } else if (ServerParseError.is(error)) {
      console.error(`[Server parse error]: ${error.bodyText}`);
    } else {
      console.error(`[Network error]: ${error.message}`);
    }

    onError?.(error);
  });
}
