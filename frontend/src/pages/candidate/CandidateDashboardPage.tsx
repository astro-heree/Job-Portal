import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyStats } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Layout } from "../../components/Layout";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../../context/AuthContext";
import type { CandidateStats } from "../../types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function CandidateDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user?.full_name}</h1>
      <p className="mt-1 text-sm text-slate-500">Here's a snapshot of your job search.</p>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Applications" value={stats.total_applications} />
            <StatCard label="Applied" value={stats.applied_count} />
            <StatCard label="Shortlisted" value={stats.shortlisted_count} />
            <StatCard label="Unread Messages" value={stats.unread_messages} />
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          to="/candidate/jobs"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Find jobs
        </Link>
        <Link
          to="/candidate/applications"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          View my applications
        </Link>
      </div>
    </Layout>
  );
}
