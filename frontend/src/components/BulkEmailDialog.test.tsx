import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BulkEmailDialog } from "./BulkEmailDialog";
import * as messagesApi from "../api/messages";

vi.mock("../api/messages");

describe("BulkEmailDialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("prefills the shortlist template by default and sends it to all recipients", async () => {
    vi.mocked(messagesApi.sendBulkMessage).mockResolvedValue([]);
    const onSent = vi.fn();

    render(
      <BulkEmailDialog isOpen recipientIds={["cand-1", "cand-2"]} onClose={vi.fn()} onSent={onSent} />
    );

    expect(screen.getByText("Email 2 candidates")).toBeInTheDocument();
    expect(screen.getByDisplayValue("You've been shortlisted — next steps")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(messagesApi.sendBulkMessage).toHaveBeenCalledWith(
        ["cand-1", "cand-2"],
        "You've been shortlisted — next steps",
        expect.stringContaining("next round")
      )
    );
    expect(onSent).toHaveBeenCalled();
    expect(await screen.findByText(/Message sent to 2 candidates/)).toBeInTheDocument();
  });

  it("switching to the rejection template swaps in its canned subject and body", async () => {
    render(<BulkEmailDialog isOpen recipientIds={["cand-1"]} onClose={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText("Template"), "rejection");

    expect(screen.getByDisplayValue("Update on your application")).toBeInTheDocument();
  });

  it("switching to a custom message clears the fields and requires input", async () => {
    render(<BulkEmailDialog isOpen recipientIds={["cand-1"]} onClose={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText("Template"), "custom");
    expect(screen.getByLabelText("Subject")).toHaveValue("");

    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Subject and message are required.")).toBeInTheDocument();
    expect(messagesApi.sendBulkMessage).not.toHaveBeenCalled();
  });

  it("shows an error banner when the send fails", async () => {
    vi.mocked(messagesApi.sendBulkMessage).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: "Server exploded" } } },
    });

    render(<BulkEmailDialog isOpen recipientIds={["cand-1"]} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Server exploded")).toBeInTheDocument();
  });
});
