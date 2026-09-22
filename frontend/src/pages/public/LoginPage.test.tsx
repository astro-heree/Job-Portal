import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { LoginPage } from "./LoginPage";
import * as authApi from "../../api/auth";

vi.mock("../../api/auth");

const MOCK_USER = {
  id: "1",
  email: "hr@jobportal.dev",
  full_name: "HR One",
  role: "HR" as const,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/hr/dashboard" element={<div>HR dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("shows the server error message when login fails", async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } } },
    });

    renderLoginPage();
    await userEvent.type(screen.getByLabelText("Email"), "hr@jobportal.dev");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("does not call the API when a field is left empty", async () => {
    renderLoginPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Please enter both your email and password.")).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("redirects to the user's home page after a successful login", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: "a-token",
      token_type: "bearer",
      user: MOCK_USER,
    });

    renderLoginPage();
    await userEvent.type(screen.getByLabelText("Email"), "hr@jobportal.dev");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByText("HR dashboard")).toBeInTheDocument());
  });
});
