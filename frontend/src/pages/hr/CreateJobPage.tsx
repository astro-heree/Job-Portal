import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { JobForm } from "../../components/JobForm";
import { Layout } from "../../components/Layout";
import type { JobFormValues } from "../../types";

export function CreateJobPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(values: JobFormValues) {
    setServerError(null);
    try {
      const job = await createJob(values);
      navigate(`/hr/jobs/${job.id}/applicants`, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900">Post a job</h1>
      <div className="mt-6 max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
        <JobForm onSubmit={handleSubmit} submitLabel="Post job" serverError={serverError} />
      </div>
    </Layout>
  );
}
