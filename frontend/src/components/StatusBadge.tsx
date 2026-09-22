import type { ApplicationStatus } from "../types";

const STYLES: Record<ApplicationStatus, string> = {
  APPLIED: "bg-slate-100 text-slate-700",
  SHORTLISTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}
