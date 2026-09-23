import type { ApplicationStatus } from "../types";

const STYLES: Record<ApplicationStatus, { badge: string; dot: string }> = {
  APPLIED: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  SHORTLISTED: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  REJECTED: { badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
