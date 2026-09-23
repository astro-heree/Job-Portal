import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchCandidates } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { BulkEmailDialog } from "../../components/BulkEmailDialog";
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
  const [skillsInput, setSkillsInput] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [page, setPage] = useState(1);

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(location);
  const debouncedSkills = useDebouncedValue(skillsInput);
  const debouncedMinExperience = useDebouncedValue(minExperience);
  const debouncedMinSalary = useDebouncedValue(minSalary);

  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, debouncedLocation, debouncedSkills, debouncedMinExperience, debouncedMinSalary]);

  useEffect(() => {
    const skills = debouncedSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsLoading(true);
    setError(null);
    searchCandidates({
      q: debouncedQ || undefined,
      location: debouncedLocation || undefined,
      skills: skills.length > 0 ? skills : undefined,
      min_experience_years: debouncedMinExperience.trim() ? Number(debouncedMinExperience) : undefined,
      min_salary: debouncedMinSalary.trim() ? Number(debouncedMinSalary) : undefined,
      page,
      page_size: 20,
    })
      .then((result) => {
        setCandidates(result.items);
        setPages(result.pages);
        setTotal(result.total);
        setSelectedIds(new Set());
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [debouncedQ, debouncedLocation, debouncedSkills, debouncedMinExperience, debouncedMinSalary, page]);

  function toggleSelected(candidateId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Candidate Directory</h1>
      <p className="mt-1 text-sm text-slate-500">Search everyone on the platform, applied or not.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <FormField label="Search" placeholder="Name or headline" value={q} onChange={(e) => setQ(e.target.value)} />
        <FormField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <FormField
          label="Skills (comma-separated)"
          placeholder="Python, React"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
        />
        <FormField
          label="Min. experience (years)"
          type="number"
          min={0}
          max={60}
          step="0.5"
          value={minExperience}
          onChange={(e) => setMinExperience(e.target.value)}
        />
        <FormField
          label="Min. expected salary ($)"
          type="number"
          min={0}
          value={minSalary}
          onChange={(e) => setMinSalary(e.target.value)}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-brand-900">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() => setIsBulkEmailOpen(true)}
            className="font-medium text-brand-700 hover:underline"
          >
            Email selected
          </button>
        </div>
      )}

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
                <li
                  key={candidate.user_id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(candidate.user_id)}
                    onChange={() => toggleSelected(candidate.user_id)}
                    className="mt-1.5"
                    aria-label={`Select ${candidate.full_name}`}
                  />
                  <Link to={`/hr/candidates/${candidate.user_id}`} className="flex-1">
                    <h2 className="font-semibold text-slate-900">{candidate.full_name}</h2>
                    <p className="text-sm text-slate-500">
                      {candidate.headline ?? "—"}
                      {candidate.location && ` · ${candidate.location}`}
                      {candidate.experience_years != null && ` · ${candidate.experience_years} yrs`}
                      {candidate.expected_salary != null &&
                        ` · $${candidate.expected_salary.toLocaleString()} expected`}
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

      <BulkEmailDialog
        isOpen={isBulkEmailOpen}
        recipientCount={selectedIds.size}
        onClose={() => setIsBulkEmailOpen(false)}
      />
    </Layout>
  );
}
