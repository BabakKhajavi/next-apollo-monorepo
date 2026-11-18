"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { Button } from "@monorepo/design-system";
import { GenerateWorkflowDocument, WorkflowsDocument } from "@monorepo/graphql-contracts";

/**
 * Kicks off ai-worker's async generation (Phase 3 of the backend) — the
 * mutation returns immediately with status GENERATING, so this just
 * navigates to the detail page; that page's own polling/refresh picks up
 * the eventual DRAFT/GENERATION_FAILED result.
 */
export function GenerateWorkflowForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generateWorkflow, { loading, error }] = useMutation(GenerateWorkflowDocument, {
    refetchQueries: [WorkflowsDocument],
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;

    const { data } = await generateWorkflow({ variables: { prompt } });
    if (data) {
      setPrompt("");
      router.push(`/workflows/${data.generateWorkflow.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 p-5">
      <label htmlFor="prompt" className="mb-2 block text-sm font-medium text-zinc-700">
        Describe a workflow to generate
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="e.g. Send me a daily email summary of new GitHub issues"
        rows={2}
        className="w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between">
        <Button type="submit" disabled={loading || !prompt.trim()}>
          {loading ? "Generating…" : "Generate workflow"}
        </Button>
        {error && <p className="text-sm text-red-600">{error.message}</p>}
      </div>
    </form>
  );
}
