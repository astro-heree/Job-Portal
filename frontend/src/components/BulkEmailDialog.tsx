import { useState, type FormEvent } from "react";
import { FormField, FormTextArea } from "./FormField";

interface BulkEmailDialogProps {
  isOpen: boolean;
  recipientCount: number;
  onClose: () => void;
}

/**
 * Beta placeholder: no email provider is wired up yet, so this only
 * collects the subject/message and shows a confirmation -- nothing is
 * sent and nothing is persisted. Intentional scope, not a stub left by
 * accident (see README "Known limitations" once this ships).
 */
export function BulkEmailDialog({ isOpen, recipientCount, onClose }: BulkEmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasSent, setHasSent] = useState(false);

  if (!isOpen) return null;

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setValidationError("Subject and message are required.");
      return;
    }
    setValidationError(null);
    setHasSent(true);
  }

  function handleClose() {
    setSubject("");
    setBody("");
    setValidationError(null);
    setHasSent(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {hasSent ? (
          <>
            <p className="text-sm text-emerald-700">
              {recipientCount} candidate{recipientCount === 1 ? "" : "s"} will receive the email shortly.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Email {recipientCount} candidate{recipientCount === 1 ? "" : "s"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Beta feature — emails aren't actually sent yet.
              </p>
            </div>
            {validationError && <p className="text-sm text-red-600">{validationError}</p>}
            <FormField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <FormTextArea label="Message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
