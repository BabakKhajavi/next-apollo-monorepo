import Link from "next/link";
import { WorkflowsDocument } from "@monorepo/graphql-contracts";
import { Badge } from "@monorepo/design-system";
import { query } from "@/lib/apollo-rsc";
import { GenerateWorkflowForm } from "@/features/workflows/GenerateWorkflowForm";
import { workflowStatusTone } from "@/features/workflows/status-tone";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  // Stress-test value for Web Vitals measurement on a heavy, unvirtualized
  // list — not the real-world default (20). Revert once that pass is done.
  const { data } = await query({ query: WorkflowsDocument, variables: { first: 1000 } });
  if (!data) throw new Error("The workflows response was empty");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8">
        <p className="mb-2 text-sm font-medium text-zinc-500">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Workflows</h1>
      </header>

      <div className="mb-8">
        <GenerateWorkflowForm />
      </div>

      {data.workflows.items.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 p-8 text-zinc-600">No workflows yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {data.workflows.items.map((workflow) => (
            <li key={workflow.id}>
              <Link
                href={`/workflows/${workflow.id}`}
                className="flex items-center justify-between gap-4 p-5 hover:bg-zinc-50"
              >
                <span className="font-medium">{workflow.name}</span>
                <Badge tone={workflowStatusTone(workflow.status)}>
                  {workflow.status.replaceAll("_", " ")}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
