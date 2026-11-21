import { Skeleton } from "@monorepo/design-system";

export function KpiSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Loading dashboard metrics"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
  );
}
