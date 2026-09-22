import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/test-utils";
import { useAuth } from "./AuthContext";
import * as authApi from "../api/auth";

vi.mock("../api/auth");

function AuthProbe() {
  const { user, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user-email">{user?.email ?? "none"}</span>
      <button onClick={() => login({ email: "hr@jobportal.dev", password: "Password123!" })}>
        Log in
      </button>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

const MOCK_USER = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "hr@jobportal.dev",
  full_name: "HR One",
  role: "HR" as const,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("has no user and is done loading when there is no stored token", async () => {
    renderWithProviders(<AuthProbe />);

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user-email")).toHaveTextContent("none");
    expect(authApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it("rehydrates the user from /auth/me when a token is already stored", async () => {
    localStorage.setItem("jobportal_token", "existing-token");
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(MOCK_USER);

    renderWithProviders(<AuthProbe />);

    await waitFor(() => expect(screen.getByTestId("user-email")).toHaveTextContent("hr@jobportal.dev"));
  });

  it("login stores the token and sets the user", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: "new-token",
      token_type: "bearer",
      user: MOCK_USER,
    });

    renderWithProviders(<AuthProbe />);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await userEvent.click(screen.getByText("Log in"));

    await waitFor(() => expect(screen.getByTestId("user-email")).toHaveTextContent("hr@jobportal.dev"));
    expect(localStorage.getItem("jobportal_token")).toBe("new-token");
  });

  it("logout clears the token and user", async () => {
    localStorage.setItem("jobportal_token", "existing-token");
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(MOCK_USER);

    renderWithProviders(<AuthProbe />);
    await waitFor(() => expect(screen.getByTestId("user-email")).toHaveTextContent("hr@jobportal.dev"));

    await userEvent.click(screen.getByText("Log out"));

    expect(screen.getByTestId("user-email")).toHaveTextContent("none");
    expect(localStorage.getItem("jobportal_token")).toBeNull();
  });
});
