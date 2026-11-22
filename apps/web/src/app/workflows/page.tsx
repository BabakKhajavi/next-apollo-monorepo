import Link from "next/link";
import { WorkflowsDocument } from "@monorepo/graphql-contracts";
import { Badge, EmptyState } from "@monorepo/design-system";
import { query } from "@/lib/apollo-rsc";
import { GenerateWorkflowForm } from "@/features/workflows/GenerateWorkflowForm";
import { workflowStatusTone } from "@/features/workflows/utils/status-tone";
import { ApolloProvider } from "@/providers/ApolloProvider";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; after?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim().slice(0, 80) || undefined;
  const { data } = await query({
    query: WorkflowsDocument,
    variables: { first: 20, after: params.after, q },
  });
  if (!data) throw new Error("The workflows response was empty");
  const next = data.workflows.nextCursor;
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-7">
      <header className="mb-8">
        <p className="mb-2 text-sm font-medium text-indigo-600">Workspace</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Workflows
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Create and manage automation workflows.
        </p>
      </header>
      <div id="generate" className="mb-8 scroll-mt-24">
        <ApolloProvider>
          <GenerateWorkflowForm />
        </ApolloProvider>
      </div>
      {q && (
        <p className="mb-4 text-sm text-slate-600">
          Results matching “{q}”{" "}
          <Link
            href="/workflows"
            className="ml-2 font-semibold text-indigo-600 hover:underline"
          >
            Clear
          </Link>
        </p>
      )}
      {data.workflows.items.length === 0 ? (
        <EmptyState
          title={q ? "No matches on this page" : "No workflows yet"}
          description={
            q
              ? "Try another term or continue to the next page."
              : "Create your first workflow above."
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {data.workflows.items.map((workflow) => (
            <li key={workflow.id}>
              <Link
                href={`/workflows/${workflow.id}`}
                className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-900">
                  {workflow.name}
                </span>
                <Badge tone={workflowStatusTone(workflow.status)}>
                  {workflow.status.replaceAll("_", " ")}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {next && (
        <div className="mt-5 flex justify-end">
          <Link
            href={`/workflows?${new URLSearchParams({ ...(q ? { q } : {}), after: next })}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Next page →
          </Link>
        </div>
      )}
    </main>
  );
}
