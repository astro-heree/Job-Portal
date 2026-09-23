import { useState, type FormEvent } from "react";
import { getErrorMessage } from "../api/client";
import { sendBulkMessage } from "../api/messages";
import { Button } from "./Button";
import { ErrorBanner } from "./ErrorBanner";
import { FormField, FormSelect, FormTextArea } from "./FormField";

interface BulkEmailDialogProps {
  isOpen: boolean;
  recipientIds: string[];
  onClose: () => void;
  onSent?: () => void;
}

type TemplateKey = "shortlist" | "rejection" | "custom";

const TEMPLATES: Record<Exclude<TemplateKey, "custom">, { label: string; subject: string; body: string }> = {
  shortlist: {
    label: "Shortlisted — moving to next round",
    subject: "You've been shortlisted — next steps",
    body: "Hi,\n\nGreat news! We've reviewed your application and would like to move you forward to the next round. Our team will be in touch shortly with more details.\n\nBest regards",
  },
  rejection: {
    label: "Application update — not moving forward",
    subject: "Update on your application",
    body: "Hi,\n\nThank you for your interest and for taking the time to apply. After careful consideration, we've decided not to move forward with your application at this time. We appreciate your interest and wish you the best in your job search.\n\nBest regards",
  },
};

const TEMPLATE_OPTIONS: { key: TemplateKey; label: string }[] = [
  { key: "shortlist", label: TEMPLATES.shortlist.label },
  { key: "rejection", label: TEMPLATES.rejection.label },
  { key: "custom", label: "Custom message" },
];

export function BulkEmailDialog({ isOpen, recipientIds, onClose, onSent }: BulkEmailDialogProps) {
  const [template, setTemplate] = useState<TemplateKey>("shortlist");
  const [subject, setSubject] = useState(TEMPLATES.shortlist.subject);
  const [body, setBody] = useState(TEMPLATES.shortlist.body);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const recipientCount = recipientIds.length;

  if (!isOpen) return null;

  function handleTemplateChange(key: TemplateKey) {
    setTemplate(key);
    if (key === "custom") {
      setSubject("");
      setBody("");
    } else {
      setSubject(TEMPLATES[key].subject);
      setBody(TEMPLATES[key].body);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setSendError(null);
    if (!subject.trim() || !body.trim()) {
      setValidationError("Subject and message are required.");
      return;
    }

    setIsSending(true);
    try {
      await sendBulkMessage(recipientIds, subject.trim(), body.trim());
      setSentCount(recipientIds.length);
      setHasSent(true);
      onSent?.();
    } catch (err) {
      setSendError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  function handleClose() {
    setTemplate("shortlist");
    setSubject(TEMPLATES.shortlist.subject);
    setBody(TEMPLATES.shortlist.body);
    setValidationError(null);
    setSendError(null);
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
                Message sent to {sentCount} candidate{sentCount === 1 ? "" : "s"}. It's in their inbox now.
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
              <p className="mt-1 text-xs text-slate-500">
                Sends a real message — it lands directly in each candidate's inbox.
              </p>
            </div>
            <ErrorBanner message={sendError} />
            {validationError && <p className="text-sm text-red-600">{validationError}</p>}
            <FormSelect
              label="Template"
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value as TemplateKey)}
            >
              {TEMPLATE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
            <FormField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <FormTextArea label="Message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSending}>
                {isSending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
