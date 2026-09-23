import { useEffect, useState } from "react";
import { listMyApplications } from "../../api/applications";
import { getErrorMessage } from "../../api/client";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormSelect } from "../../components/FormField";
import { Layout } from "../../components/Layout";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApplicationStatus, CandidateApplicationOut } from "../../types";

const STATUS_OPTIONS: ApplicationStatus[] = ["APPLIED", "SHORTLISTED", "REJECTED"];

export function MyApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState<CandidateApplicationOut[]>([]);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    listMyApplications({ status: status || undefined, page, page_size: 10 })
      .then((result) => {
        setApplications(result.items);
        setPages(result.pages);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [status, page]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Applications</h1>
      <p className="mt-1 text-sm text-slate-500">Track the status of every job you've applied to.</p>

      <div className="mt-6 max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <FormSelect
          label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ApplicationStatus | "");
            setPage(1);
          }}
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelect>
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {!isLoading && applications.length === 0 && (
          <EmptyState title="No applications yet" description="Jobs you apply to will show up here." />
        )}
        {!isLoading && applications.length > 0 && (
          <>
            <ul className="flex flex-col gap-3">
              {applications.map((application) => (
                <li
                  key={application.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div>
                    <h2 className="font-semibold text-slate-900">{application.job_title}</h2>
                    <p className="text-sm text-slate-500">
                      {application.company_name ?? "—"} · {application.job_location}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Applied {new Date(application.applied_at).toLocaleDateString()}
                      {!application.job_is_active && " · This job is no longer active"}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </Layout>
  );
}
