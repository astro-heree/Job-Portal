import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { downloadCandidateResume, getCandidate } from "../../api/candidates";
import { downloadBlob, getErrorMessage } from "../../api/client";
import { sendBulkMessage } from "../../api/messages";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, FormTextArea } from "../../components/FormField";
import { Layout } from "../../components/Layout";
import { ResumeViewerDialog } from "../../components/ResumeViewerDialog";
import { Spinner } from "../../components/Spinner";
import type { CandidateProfile } from "../../types";

export function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isResumeViewerOpen, setIsResumeViewerOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    if (!candidateId) return;
    getCandidate(candidateId)
      .then(setCandidate)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [candidateId]);

  async function handleDownloadResume() {
    if (!candidateId || !candidate) return;
    setDownloadError(null);
    try {
      const blob = await downloadCandidateResume(candidateId);
      downloadBlob(blob, `${candidate.full_name.replace(/\s+/g, "_")}_resume.pdf`);
    } catch (err) {
      setDownloadError(getErrorMessage(err));
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!candidateId) return;

    setMessageError(null);
    setMessageSent(false);
    if (!subject.trim() || !body.trim()) {
      setMessageError("Subject and message are required.");
      return;
    }

    setIsSendingMessage(true);
    try {
      await sendBulkMessage([candidateId], subject.trim(), body.trim());
      setSubject("");
      setBody("");
      setMessageSent(true);
    } catch (err) {
      setMessageError(getErrorMessage(err));
    } finally {
      setIsSendingMessage(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  if (loadError || !candidate) {
    return (
      <Layout>
        <ErrorBanner message={loadError ?? "Candidate not found."} />
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/hr/candidates" className="text-sm text-blue-600 hover:underline">
        ← Back to directory
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">{candidate.full_name}</h1>
        <p className="mt-1 text-slate-500">{candidate.email}</p>
        {candidate.headline && <p className="mt-2 font-medium text-slate-700">{candidate.headline}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Location</dt>
            <dd className="font-medium text-slate-800">{candidate.location ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Experience</dt>
            <dd className="font-medium text-slate-800">
              {candidate.experience_years != null ? `${candidate.experience_years} years` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="font-medium text-slate-800">{candidate.phone ?? "—"}</dd>
          </div>
        </dl>

        {candidate.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {candidate.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6">
          <ErrorBanner message={downloadError} />
          {candidate.has_resume ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsResumeViewerOpen(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View resume
              </button>
              <button
                type="button"
                onClick={handleDownloadResume}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Download
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No resume on file.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Send a message</h2>
        <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
          <ErrorBanner message={messageError} />
          {messageSent && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Message sent.
            </p>
          )}
          <FormField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <FormTextArea label="Message" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          <button
            type="submit"
            disabled={isSendingMessage}
            className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSendingMessage ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>

      <ResumeViewerDialog
        isOpen={isResumeViewerOpen}
        candidateName={candidate.full_name}
        fetchResume={() => downloadCandidateResume(candidate.user_id)}
        onClose={() => setIsResumeViewerOpen(false)}
      />
    </Layout>
  );
}
