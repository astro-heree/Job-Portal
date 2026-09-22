import { useEffect, useState } from "react";
import { listInbox, markRead } from "../../api/messages";
import { getErrorMessage } from "../../api/client";
import { EmptyState } from "../../components/EmptyState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Layout } from "../../components/Layout";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import type { Message } from "../../types";

export function InboxPage() {
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    setError(null);
    listInbox(page)
      .then((result) => {
        setMessages(result.items);
        setPages(result.pages);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [page]);

  async function handleOpen(message: Message) {
    if (message.read_at) return;
    try {
      const updated = await markRead(message.id);
      setMessages((current) => current.map((m) => (m.id === updated.id ? updated : m)));
    } catch {
      // Marking read is best-effort UI polish; a failure here shouldn't
      // block the user from reading the message they already opened.
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900">Inbox</h1>

      <div className="mt-6">
        <ErrorBanner message={error} />
        {isLoading && <Spinner />}
        {!isLoading && messages.length === 0 && (
          <EmptyState title="No messages yet" description="Messages from HR will show up here." />
        )}
        {!isLoading && messages.length > 0 && (
          <>
            <ul className="flex flex-col gap-3">
              {messages.map((message) => (
                <li
                  key={message.id}
                  onClick={() => handleOpen(message)}
                  className={`cursor-pointer rounded-lg border p-5 transition ${
                    message.read_at ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">{message.subject}</h2>
                    {!message.read_at && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{message.sender_company_name ?? "—"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(message.sent_at).toLocaleString()}</p>
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
