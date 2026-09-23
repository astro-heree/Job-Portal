import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchJobs } from "../../api/jobs";
import { getErrorMessage } from "../../api/client";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, FormSelect } from "../../components/FormField";
import { Layout } from "../../components/Layout";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { EmploymentType, Job } from "../../types";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];

export function JobSearchPage() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [page, setPage] = useState(1);

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(location);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, debouncedLocation, employmentType]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    searchJobs({
      q: debouncedQ || undefined,
      location: debouncedLocation || undefined,
      employment_type: employmentType || undefined,
      page,
      page_size: 10,
    })
      .then((result) => {
        setJobs(result.items);
        setPages(result.pages);
        setTotal(result.total);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [debouncedQ, debouncedLocation, employmentType, page]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Find jobs</h1>
      <p className="mt-1 text-sm text-slate-500">Search open roles and apply in a couple of clicks.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <FormField label="Search" placeholder="Title or description" value={q} onChange={(e) => setQ(e.target.value)} />
        <FormField label="Location" placeholder="City or Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
        <FormSelect
          label="Employment type"
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value as EmploymentType | "")}
        >
          <option value="">Any</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </FormSelect>
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {!isLoading && jobs.length === 0 && (
          <EmptyState title="No jobs found" description="Try adjusting your search or filters." />
        )}
        {!isLoading && jobs.length > 0 && (
          <>
            <p className="mb-3 text-sm text-slate-500">{total} job{total === 1 ? "" : "s"} found</p>
            <ul className="flex flex-col gap-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    to={`/candidate/jobs/${job.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold text-slate-900">{job.title}</h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {job.company_name ?? "—"} · {job.location}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                        {job.employment_type.replace("_", " ")}
                      </span>
                    </div>
                    {job.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
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
