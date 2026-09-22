import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { RegisterPage } from "./RegisterPage";
import * as authApi from "../../api/auth";

vi.mock("../../api/auth");

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/candidate/dashboard" element={<div>Candidate dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("rejects a short password without calling the API", async () => {
    renderRegisterPage();

    await userEvent.type(screen.getByLabelText("Full name"), "Jane Doe");
    await userEvent.type(screen.getByLabelText("Email"), "jane@jobportal.dev");
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.type(screen.getByLabelText("Confirm password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    renderRegisterPage();

    await userEvent.type(screen.getByLabelText("Full name"), "Jane Doe");
    await userEvent.type(screen.getByLabelText("Email"), "jane@jobportal.dev");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Password123?");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("requires a company name when registering as HR", async () => {
    renderRegisterPage();

    await userEvent.selectOptions(screen.getByLabelText("I am registering as"), "HR");
    await userEvent.type(screen.getByLabelText("Full name"), "HR Person");
    await userEvent.type(screen.getByLabelText("Email"), "hr@jobportal.dev");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Company name is required for HR accounts.")).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("submits the correct payload and redirects on success", async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      access_token: "a-token",
      token_type: "bearer",
      user: {
        id: "1",
        email: "jane@jobportal.dev",
        full_name: "Jane Doe",
        role: "CANDIDATE",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
    });

    renderRegisterPage();

    await userEvent.type(screen.getByLabelText("Full name"), "Jane Doe");
    await userEvent.type(screen.getByLabelText("Email"), "jane@jobportal.dev");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        full_name: "Jane Doe",
        email: "jane@jobportal.dev",
        password: "Password123!",
        role: "CANDIDATE",
      })
    );
    await waitFor(() => expect(screen.getByText("Candidate dashboard")).toBeInTheDocument());
  });
});
