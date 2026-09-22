import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import * as AuthContextModule from "../context/AuthContext";

vi.mock("../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<typeof AuthContextModule>();
  return { ...actual, useAuth: vi.fn() };
});

const useAuthMock = vi.mocked(AuthContextModule.useAuth);

function renderProtected(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/hr/dashboard" element={<div>HR home</div>} />
        <Route path="/candidate/dashboard" element={<div>Candidate home</div>} />
        <Route
          path="/hr/jobs"
          element={
            <ProtectedRoute allowedRole="HR">
              <div>HR-only content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("redirects to /login when there is no authenticated user", () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected("/hr/jobs");

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects to the user's own home when the role doesn't match", () => {
    useAuthMock.mockReturnValue({
      user: {
        id: "1",
        email: "cand@jobportal.dev",
        full_name: "Cand",
        role: "CANDIDATE",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected("/hr/jobs");

    expect(screen.getByText("Candidate home")).toBeInTheDocument();
  });

  it("renders the protected content when the role matches", () => {
    useAuthMock.mockReturnValue({
      user: {
        id: "1",
        email: "hr@jobportal.dev",
        full_name: "HR",
        role: "HR",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected("/hr/jobs");

    expect(screen.getByText("HR-only content")).toBeInTheDocument();
  });

  it("shows a loading state instead of redirecting while auth is still resolving", () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected("/hr/jobs");

    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
    expect(screen.queryByText("HR-only content")).not.toBeInTheDocument();
  });
});
