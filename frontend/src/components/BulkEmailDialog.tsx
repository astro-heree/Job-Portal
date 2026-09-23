import { useState, type FormEvent } from "react";
import { Button } from "./Button";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
        {hasSent ? (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="pt-1.5 text-sm text-slate-700">
                {recipientCount} candidate{recipientCount === 1 ? "" : "s"} will receive the email shortly.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button size="sm" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Email {recipientCount} candidate{recipientCount === 1 ? "" : "s"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Beta feature — emails aren't actually sent yet.</p>
            </div>
            {validationError && <p className="text-sm text-red-600">{validationError}</p>}
            <FormField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <FormTextArea label="Message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Send
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
