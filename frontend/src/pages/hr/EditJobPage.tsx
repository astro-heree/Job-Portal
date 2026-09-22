import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJob, updateJob } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { JobForm } from "../../components/JobForm";
import { Layout } from "../../components/Layout";
import { Spinner } from "../../components/Spinner";
import type { Job, JobFormValues } from "../../types";

export function EditJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then(setJob)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  async function handleSubmit(values: JobFormValues) {
    if (!jobId) return;
    setServerError(null);
    try {
      await updateJob(jobId, values);
      navigate("/hr/jobs", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
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
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900">Edit job</h1>
      <div className="mt-6 max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
        <JobForm initialValues={job} onSubmit={handleSubmit} submitLabel="Save changes" serverError={serverError} />
      </div>
    </Layout>
  );
}
