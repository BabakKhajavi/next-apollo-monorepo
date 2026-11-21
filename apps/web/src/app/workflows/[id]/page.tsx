import { Suspense } from "react";
import {
  WorkflowDocument,
  ExecutionsDocument,
} from "@monorepo/graphql-contracts";
import { PreloadQuery } from "@/lib/apollo-rsc";
import { WorkflowHeader } from "@/features/workflows/WorkflowHeader";
import { ExecutionsList } from "@/features/workflows/ExecutionsList";
import { ApolloProvider } from "@/providers/ApolloProvider";

export const dynamic = "force-dynamic";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <ApolloProvider>
        {/*
         * Both sections stream from the server and resolve client-side via
         * useSuspenseQuery — WorkflowHeader additionally subscribes to live
         * AppSync Events updates (Phase 3), patching the same cache entry
         * this query reads, so status changes (GENERATING -> DRAFT, etc.)
         * and new execution runs appear without a page refresh.
         */}
        <PreloadQuery query={WorkflowDocument} variables={{ id }}>
          <Suspense
            fallback={<p className="text-zinc-600">Loading workflow…</p>}
          >
            <WorkflowHeader id={id} />
          </Suspense>
        </PreloadQuery>

        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-500">Executions</h2>
          <PreloadQuery
            query={ExecutionsDocument}
            variables={{ workflowId: id, first: 10 }}
          >
            <Suspense
              fallback={<p className="text-zinc-600">Loading executions…</p>}
            >
              <ExecutionsList workflowId={id} />
            </Suspense>
          </PreloadQuery>
        </section>
      </ApolloProvider>
    </main>
  );
}
