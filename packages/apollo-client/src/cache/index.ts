import { InMemoryCache as DefaultInMemoryCache, type InMemoryCacheConfig } from "@apollo/client";
import { typePolicies } from "./policies/index";

export { typePolicies } from "./policies/index";
export { relayStylePagination, offsetLimitPagination } from "./pagination/index";

export interface CreateCacheOptions<C extends typeof DefaultInMemoryCache = typeof DefaultInMemoryCache>
  extends Partial<InMemoryCacheConfig> {
  /**
   * @apollo/client-integration-nextjs's ApolloClient requires its own
   * branded InMemoryCache subclass, not the plain @apollo/client one —
   * pass it here when constructing a cache for Next.js RSC/SSR usage.
   */
  InMemoryCacheClass?: C;
}

export function createCache<C extends typeof DefaultInMemoryCache = typeof DefaultInMemoryCache>(
  overrides?: CreateCacheOptions<C>,
): InstanceType<C> {
  const { InMemoryCacheClass, ...cacheConfig } = overrides ?? {};
  const CacheClass = (InMemoryCacheClass ?? DefaultInMemoryCache) as C;

  return new CacheClass({
    ...cacheConfig,
    typePolicies: {
      ...typePolicies,
      ...cacheConfig.typePolicies,
    },
  }) as InstanceType<C>;
}
