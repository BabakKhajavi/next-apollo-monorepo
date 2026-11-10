import type { TypePolicies } from "@apollo/client";

/**
 * The demo schema (Countries API) has no `id` field on `Country`/`Continent` —
 * `code` is the natural unique key, so normalization must be told to use it.
 * Extend this object as real domain types are added.
 */
export const typePolicies: TypePolicies = {
  Country: {
    keyFields: ["code"],
  },
  Continent: {
    keyFields: ["code"],
  },
};
