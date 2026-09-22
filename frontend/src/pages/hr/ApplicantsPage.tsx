import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bulkUpdateStatus, updateApplicationStatus } from "../../api/applications";
import { downloadBlob, getErrorMessage } from "../../api/client";
import { downloadCandidateResume } from "../../api/candidates";
import { listJobApplicants } from "../../api/jobs";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, FormSelect } from "../../components/FormField";
import { Layout } from "../../components/Layout";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import { StarRating } from "../../components/StarRating";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApplicantOut, ApplicationStatus } from "../../types";

const STATUS_OPTIONS: ApplicationStatus[] = ["APPLIED", "SHORTLISTED", "REJECTED"];

export function ApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();

  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [applicants, setApplicants] = useState<ApplicantOut[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingBulkStatus, setPendingBulkStatus] = useState<ApplicationStatus | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  function load() {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    listJobApplicants(jobId, { status: status || undefined, q: q || undefined, page, page_size: 20 })
      .then((result) => {
        setApplicants(result.items);
        setPages(result.pages);
        setTotal(result.total);
        setSelectedIds(new Set());
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [jobId, status, q, page]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSingleStatusChange(applicationId: string, newStatus: ApplicationStatus) {
    setError(null);
    try {
      const updated = await updateApplicationStatus(applicationId, newStatus);
      setApplicants((current) =>
        current.map((a) => (a.id === applicationId ? { ...a, status: updated.status } : a))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDownloadResume(candidateId: string, candidateName: string) {
    setError(null);
    try {
      const blob = await downloadCandidateResume(candidateId);
      downloadBlob(blob, `${candidateName.replace(/\s+/g, "_")}_resume.pdf`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleBulkConfirm() {
    if (!pendingBulkStatus || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    setError(null);
    try {
      await bulkUpdateStatus(Array.from(selectedIds), pendingBulkStatus);
      setPendingBulkStatus(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBulkUpdating(false);
    }
  }

  return (
    <Layout>
      <Link to="/hr/jobs" className="text-sm text-blue-600 hover:underline">
        ← Back to my jobs
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Applicants</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <FormSelect
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ApplicationStatus | "");
            setPage(1);
          }}
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelect>
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
          <span>{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() => setPendingBulkStatus("SHORTLISTED")}
            className="font-medium text-blue-700 hover:underline"
          >
            Shortlist
          </button>
          <button
            type="button"
            onClick={() => setPendingBulkStatus("REJECTED")}
            className="font-medium text-red-700 hover:underline"
          >
            Reject
          </button>
        </div>
      )}

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {!isLoading && applicants.length === 0 && (
          <EmptyState title="No applicants yet" description="Applicants for this job will show up here." />
        )}
        {!isLoading && applicants.length > 0 && (
          <>
            <p className="mb-3 text-sm text-slate-500">{total} applicant{total === 1 ? "" : "s"}</p>
            <ul className="flex flex-col gap-3">
              {applicants.map((applicant) => (
                <li key={applicant.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(applicant.id)}
                      onChange={() => toggleSelected(applicant.id)}
                      className="mt-1.5"
                      aria-label={`Select ${applicant.candidate_full_name}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            to={`/hr/candidates/${applicant.candidate_id}`}
                            className="font-semibold text-slate-900 hover:underline"
                          >
                            {applicant.candidate_full_name}
                          </Link>
                          <p className="text-sm text-slate-500">{applicant.candidate_email}</p>
                          {applicant.candidate_headline && (
                            <p className="text-sm text-slate-600">{applicant.candidate_headline}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StarRating rating={applicant.ats_rating} />
                          <StatusBadge status={applicant.status} />
                        </div>
                      </div>

                      {applicant.candidate_skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {applicant.candidate_skills.map((skill) => (
                            <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {applicant.cover_note && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{applicant.cover_note}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        {applicant.has_resume && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadResume(applicant.candidate_id, applicant.candidate_full_name)
                            }
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Download resume
                          </button>
                        )}
                        <FormSelect
                          label=""
                          value={applicant.status}
                          onChange={(e) =>
                            handleSingleStatusChange(applicant.id, e.target.value as ApplicationStatus)
                          }
                          className="!py-1"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </FormSelect>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingBulkStatus !== null}
        title={`${pendingBulkStatus === "SHORTLISTED" ? "Shortlist" : "Reject"} ${selectedIds.size} applicant${
          selectedIds.size === 1 ? "" : "s"
        }?`}
        confirmLabel={isBulkUpdating ? "Updating…" : "Confirm"}
        onConfirm={handleBulkConfirm}
        onCancel={() => setPendingBulkStatus(null)}
      />
    </Layout>
  );
}
