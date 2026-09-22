import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchCandidates } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField } from "../../components/FormField";
import { Layout } from "../../components/Layout";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { CandidateProfile } from "../../types";

export function CandidateDirectoryPage() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(location);

  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, debouncedLocation]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    searchCandidates({ q: debouncedQ || undefined, location: debouncedLocation || undefined, page, page_size: 20 })
      .then((result) => {
        setCandidates(result.items);
        setPages(result.pages);
        setTotal(result.total);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [debouncedQ, debouncedLocation, page]);

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900">Candidate Directory</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Search" placeholder="Name or headline" value={q} onChange={(e) => setQ(e.target.value)} />
        <FormField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {!isLoading && candidates.length === 0 && (
          <EmptyState title="No candidates found" description="Try a different search or filter." />
        )}
        {!isLoading && candidates.length > 0 && (
          <>
            <p className="mb-3 text-sm text-slate-500">{total} candidate{total === 1 ? "" : "s"}</p>
            <ul className="flex flex-col gap-3">
              {candidates.map((candidate) => (
                <li key={candidate.user_id}>
                  <Link
                    to={`/hr/candidates/${candidate.user_id}`}
                    className="block rounded-lg border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <h2 className="font-semibold text-slate-900">{candidate.full_name}</h2>
                    <p className="text-sm text-slate-500">
                      {candidate.headline ?? "—"}
                      {candidate.location && ` · ${candidate.location}`}
                      {candidate.experience_years != null && ` · ${candidate.experience_years} yrs`}
                    </p>
                    {candidate.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {candidate.skills.map((skill) => (
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
