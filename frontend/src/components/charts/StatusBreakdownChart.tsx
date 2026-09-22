interface StatusBreakdownChartProps {
  applied: number;
  shortlisted: number;
  rejected: number;
}

const ROWS: { key: keyof Omit<StatusBreakdownChartProps, never>; label: string; color: string }[] = [
  { key: "applied", label: "Applied", color: "#64748b" },
  { key: "shortlisted", label: "Shortlisted", color: "#10b981" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

export function StatusBreakdownChart(props: StatusBreakdownChartProps) {
  const total = Math.max(1, props.applied + props.shortlisted + props.rejected);

  return (
    <div className="flex flex-col gap-3">
      {ROWS.map((row) => {
        const value = props[row.key];
        const widthPct = (value / total) * 100;
        return (
          <div key={row.key}>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>{row.label}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${widthPct}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
