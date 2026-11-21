import type { ReactNode } from "react";

export type MetricTone = "violet" | "green" | "blue" | "rose";

const tones: Record<MetricTone, { card: string; icon: string }> = {
  violet: {
    card: "from-violet-50 via-white to-violet-100/80 border-violet-200",
    icon: "bg-violet-600 text-white",
  },
  green: {
    card: "from-emerald-50 via-white to-green-100/80 border-emerald-200",
    icon: "bg-emerald-500 text-white",
  },
  blue: {
    card: "from-blue-50 via-white to-sky-100/80 border-blue-200",
    icon: "bg-blue-600 text-white",
  },
  rose: {
    card: "from-rose-50 via-white to-rose-100/80 border-rose-200",
    icon: "bg-rose-500 text-white",
  },
};

export interface MetricCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone: MetricTone;
  detail?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  tone,
  detail,
}: MetricCardProps) {
  const style = tones[tone];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-[0_4px_20px_rgba(20,39,78,0.04)] ${style.card}`}
    >
      <div className="relative z-10 flex items-center gap-4">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${style.icon}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-slate-950">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {detail && (
            <p className="mt-1 text-xs font-medium text-slate-600">{detail}</p>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-12 -right-8 size-36 rounded-full border-[20px] border-white/40" />
    </div>
  );
}
