import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyStats } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { buttonClasses } from "../../components/Button";
import { StatusBreakdownChart } from "../../components/charts/StatusBreakdownChart";
import { ErrorBanner } from "../../components/ErrorBanner";
import { DocumentIcon, EnvelopeIcon, PaperAirplaneIcon, StarBadgeIcon, XCircleIcon } from "../../components/icons";
import { Layout } from "../../components/Layout";
import { Spinner } from "../../components/Spinner";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import type { CandidateStats } from "../../types";

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
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.full_name}</h1>
      <p className="mt-1 text-sm text-slate-500">Here's a snapshot of your job search.</p>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {stats && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Total Applications" value={stats.total_applications} icon={<DocumentIcon />} accent="brand" />
              <StatCard label="Applied" value={stats.applied_count} icon={<PaperAirplaneIcon />} accent="slate" />
              <StatCard label="Shortlisted" value={stats.shortlisted_count} icon={<StarBadgeIcon />} accent="emerald" />
              <StatCard label="Rejected" value={stats.rejected_count} icon={<XCircleIcon />} accent="rose" />
              <StatCard label="Unread Messages" value={stats.unread_messages} icon={<EnvelopeIcon />} accent="amber" />
            </div>

            <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Your application status breakdown</h2>
              <StatusBreakdownChart
                applied={stats.applied_count}
                shortlisted={stats.shortlisted_count}
                rejected={stats.rejected_count}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/candidate/jobs" className={buttonClasses("primary")}>
          Find jobs
        </Link>
        <Link to="/candidate/applications" className={buttonClasses("secondary")}>
          View my applications
        </Link>
      </div>
    </Layout>
  );
}
