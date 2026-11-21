import { Panel, Skeleton } from "@monorepo/design-system";
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-7">
      <Skeleton className="mb-6 h-10 w-48" />
      <Panel title="Recent Executions">
        <Skeleton className="h-72" />
      </Panel>
    </main>
  );
}
