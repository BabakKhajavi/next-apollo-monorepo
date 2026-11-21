import type { HTMLAttributes } from "react";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  action?: React.ReactNode;
}

export function Panel({
  title,
  action,
  className = "",
  children,
  ...props
}: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(20,39,78,0.05)] sm:p-6 ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
