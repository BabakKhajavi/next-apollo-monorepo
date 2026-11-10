import { Suspense } from "react";
import { PreloadQuery } from "@/lib/apollo-rsc";
import { GetContinentsDocument } from "@/types/__generated__/graphql";
import { ContinentsList } from "./ContinentsList";
import "./queries";

// This page's data is fetched with `cache: "no-store"` (see http-link.ts) —
// never safe to prerender statically, since it's meant to carry per-request
// auth state once @monorepo/auth is wired in.
export const dynamic = "force-dynamic";

/**
 * Temporary end-to-end verification page for the @monorepo/apollo-client
 * package, running against the public Countries API placeholder schema.
 * Remove (or promote to a real feature) once apps/api ships a real schema.
 */
export default function DemoPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Apollo Client Demo — Continents
      </h1>
      <PreloadQuery query={GetContinentsDocument}>
        <Suspense fallback={<p>Loading continents…</p>}>
          <ContinentsList />
        </Suspense>
      </PreloadQuery>
    </main>
  );
}
