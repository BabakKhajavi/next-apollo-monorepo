import type { FieldPolicy, TypePolicies } from "@apollo/client";

/**
 * `workflows`/`executions` return `{ items, nextCursor }`, not the
 * edges/pageInfo shape `relayStylePagination` expects — merge function
 * appends items and keeps the latest cursor. `keyArgs: false` because the
 * only arguments are pagination cursors, not independent filters; a
 * `workflowId`-scoped list (`executions`) still needs its own cache entry
 * per workflow, so that field policy keys on `["workflowId"]` instead.
 */
function cursorPagination(keyArgs: FieldPolicy["keyArgs"] = false): FieldPolicy {
  return {
    keyArgs,
    merge(existing, incoming) {
      if (!existing) return incoming;
      return {
        ...incoming,
        items: [...existing.items, ...incoming.items],
      };
    },
  };
}

export const typePolicies: TypePolicies = {
  Query: {
    fields: {
      workflows: cursorPagination(),
      executions: cursorPagination(["workflowId"]),
    },
  },
};
