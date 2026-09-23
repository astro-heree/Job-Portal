import { useEffect, useState } from "react";
import { downloadBlob, getErrorMessage } from "../api/client";
import { Button } from "./Button";
import { ErrorBanner } from "./ErrorBanner";
import { Spinner } from "./Spinner";

interface ResumeViewerDialogProps {
  isOpen: boolean;
  /** Used in the dialog title and as the downloaded file's base name. */
  candidateName: string;
  fetchResume: () => Promise<Blob>;
  onClose: () => void;
}

export function ResumeViewerDialog({
  isOpen,
  candidateName,
  fetchResume,
  onClose,
}: ResumeViewerDialogProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Re-fetch only when the dialog transitions open, not on every re-render
  // of the caller (which may hand us a fresh `fetchResume` closure each time).
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);
    setBlob(null);
    fetchResume()
      .then(setBlob)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!isOpen) return null;

  function handleDownload() {
    if (blob) {
      downloadBlob(blob, `${candidateName.replace(/\s+/g, "_")}_resume.pdf`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-[2px]">
      <div className="flex h-full w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">{candidateName}'s resume</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!blob}>
              Download
            </Button>
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <ErrorBanner message={error} />
          {isLoading && <Spinner label="Loading resume…" />}
          {objectUrl && (
            <iframe
              src={objectUrl}
              title={`${candidateName}'s resume`}
              className="h-full w-full rounded-lg border border-slate-200"
            />
          )}
        </div>
      </div>
    </div>
  );
}
