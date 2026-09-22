import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/hr";
import { getErrorMessage } from "../../api/client";
import { StatusBreakdownChart } from "../../components/charts/StatusBreakdownChart";
import { TrendLineChart } from "../../components/charts/TrendLineChart";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Layout } from "../../components/Layout";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../../context/AuthContext";
import type { HRDashboardStats } from "../../types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function HRDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HRDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user?.full_name}</h1>
      <p className="mt-1 text-sm text-slate-500">Here's how your hiring pipeline is doing.</p>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {stats && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Jobs" value={stats.total_jobs} />
              <StatCard label="Active Jobs" value={stats.active_jobs} />
              <StatCard label="Total Applicants" value={stats.total_applicants} />
              <StatCard label="Shortlisted" value={stats.shortlisted_count} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-slate-900">Application status breakdown</h2>
                <StatusBreakdownChart
                  applied={stats.applied_count}
                  shortlisted={stats.shortlisted_count}
                  rejected={stats.rejected_count}
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-slate-900">Applications, last 14 days</h2>
                <TrendLineChart data={stats.applications_trend} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          to="/hr/jobs/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Post a job
        </Link>
        <Link
          to="/hr/jobs"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Manage my jobs
        </Link>
      </div>
    </Layout>
  );
}
