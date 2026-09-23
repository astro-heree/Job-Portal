import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/hr";
import { getErrorMessage } from "../../api/client";
import { buttonClasses } from "../../components/Button";
import { StatusBreakdownChart } from "../../components/charts/StatusBreakdownChart";
import { TrendLineChart } from "../../components/charts/TrendLineChart";
import { ErrorBanner } from "../../components/ErrorBanner";
import { BriefcaseIcon, CheckBadgeIcon, StarBadgeIcon, UsersIcon } from "../../components/icons";
import { Layout } from "../../components/Layout";
import { Spinner } from "../../components/Spinner";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import type { HRDashboardStats } from "../../types";

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
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.full_name}</h1>
      <p className="mt-1 text-sm text-slate-500">Here's how your hiring pipeline is doing.</p>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {stats && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Jobs" value={stats.total_jobs} icon={<BriefcaseIcon />} accent="brand" />
              <StatCard label="Active Jobs" value={stats.active_jobs} icon={<CheckBadgeIcon />} accent="emerald" />
              <StatCard label="Total Applicants" value={stats.total_applicants} icon={<UsersIcon />} accent="slate" />
              <StatCard label="Shortlisted" value={stats.shortlisted_count} icon={<StarBadgeIcon />} accent="amber" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-900">Application status breakdown</h2>
                <StatusBreakdownChart
                  applied={stats.applied_count}
                  shortlisted={stats.shortlisted_count}
                  rejected={stats.rejected_count}
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-900">Applications, last 14 days</h2>
                <TrendLineChart data={stats.applications_trend} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/hr/jobs/new" className={buttonClasses("primary")}>
          Post a job
        </Link>
        <Link to="/hr/jobs" className={buttonClasses("secondary")}>
          Manage my jobs
        </Link>
      </div>
    </Layout>
  );
}
