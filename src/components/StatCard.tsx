import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-3 transition-transform hover:-translate-y-0.5",
        highlight && "gradient-pitch border-transparent text-primary-foreground shadow-lift",
      )}
    >
      <p className="font-display text-2xl font-extrabold leading-none">{value}</p>
      <p
        className={cn(
          "mt-1 text-[11px] font-semibold uppercase tracking-wide",
          highlight ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  );
}