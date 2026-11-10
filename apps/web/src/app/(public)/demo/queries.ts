import { gql } from "@apollo/client";

// This will never be consumed at runtime — wrapped in `if (false)` so the
// bundler can omit it; GraphQL Code Generator statically extracts it from
// source to build the typed documents imported below.
if (false) {
  gql`
    fragment ContinentItem_continent on Continent {
      code
      name
    }
  `;

  gql`
    query GetContinents {
      continents {
        code
        ...ContinentItem_continent
      }
    }
  `;
}
