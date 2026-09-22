import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyJobs } from "../../api/hr";
import { getErrorMessage } from "../../api/client";
import { setJobStatus } from "../../api/jobs";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Layout } from "../../components/Layout";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import type { Job } from "../../types";

export function MyJobsPage() {
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    setError(null);
    listMyJobs(page)
      .then((result) => {
        setJobs(result.items);
        setPages(result.pages);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [page]);

  async function handleToggleStatus(job: Job) {
    setTogglingId(job.id);
    setError(null);
    try {
      const updated = await setJobStatus(job.id, !job.is_active);
      setJobs((current) => current.map((j) => (j.id === updated.id ? updated : j)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">My Jobs</h1>
        <Link
          to="/hr/jobs/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Post a job
        </Link>
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {!isLoading && jobs.length === 0 && (
          <EmptyState title="No jobs posted yet" description="Post your first job to start receiving applications." />
        )}
        {!isLoading && jobs.length > 0 && (
          <>
            <ul className="flex flex-col gap-3">
              {jobs.map((job) => (
                <li key={job.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-slate-900">{job.title}</h2>
                      <p className="text-sm text-slate-500">
                        {job.location} · {job.employment_type.replace("_", " ")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        job.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {job.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <Link to={`/hr/jobs/${job.id}/applicants`} className="font-medium text-blue-600 hover:underline">
                      View applicants
                    </Link>
                    <Link to={`/hr/jobs/${job.id}/edit`} className="font-medium text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(job)}
                      disabled={togglingId === job.id}
                      className="font-medium text-slate-600 hover:underline disabled:opacity-50"
                    >
                      {job.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
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
