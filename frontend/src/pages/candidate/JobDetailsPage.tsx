import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applyToJob, getJob } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormTextArea } from "../../components/FormField";
import { Layout } from "../../components/Layout";
import { Spinner } from "../../components/Spinner";
import type { Job } from "../../types";

function formatSalary(job: Job): string | null {
  if (job.salary_min == null && job.salary_max == null) return null;
  if (job.salary_min != null && job.salary_max != null) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
  }
  return `$${(job.salary_min ?? job.salary_max)!.toLocaleString()}+`;
}

function formatExperience(job: Job): string | null {
  if (job.min_experience_years == null && job.max_experience_years == null) return null;
  if (job.min_experience_years != null && job.max_experience_years != null) {
    return `${job.min_experience_years} - ${job.max_experience_years} years`;
  }
  return `${job.min_experience_years ?? job.max_experience_years} years`;
}

export function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then(setJob)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  async function handleApply() {
    if (!jobId) return;
    setApplyError(null);
    setIsApplying(true);
    try {
      await applyToJob(jobId, coverNote);
      setHasApplied(true);
    } catch (err) {
      setApplyError(getErrorMessage(err));
    } finally {
      setIsApplying(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  if (loadError || !job) {
    return (
      <Layout>
        <ErrorBanner message={loadError ?? "Job not found."} />
        <Link to="/candidate/jobs" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Back to search
        </Link>
      </Layout>
    );
  }

  const salary = formatSalary(job);
  const experience = formatExperience(job);

  return (
    <Layout>
      <Link to="/candidate/jobs" className="text-sm text-blue-600 hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
        <p className="mt-1 text-slate-500">
          {job.company_name ?? "—"} · {job.location} · {job.employment_type.replace("_", " ")}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {experience && (
            <div>
              <dt className="text-slate-500">Experience</dt>
              <dd className="font-medium text-slate-800">{experience}</dd>
            </div>
          )}
          {salary && (
            <div>
              <dt className="text-slate-500">Salary</dt>
              <dd className="font-medium text-slate-800">{salary}</dd>
            </div>
          )}
        </dl>

        {job.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        )}

        <p className="mt-6 whitespace-pre-wrap text-sm text-slate-700">{job.description}</p>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        {hasApplied ? (
          <p className="font-medium text-emerald-700">
            Application submitted! You can track its status from "My Applications".
          </p>
        ) : (
          <>
            <h2 className="mb-3 font-semibold text-slate-900">Apply to this job</h2>
            <ErrorBanner message={applyError} />
            <div className="mt-3">
              <FormTextArea
                label="Cover note (optional)"
                rows={4}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isApplying ? "Submitting…" : "Submit application"}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
