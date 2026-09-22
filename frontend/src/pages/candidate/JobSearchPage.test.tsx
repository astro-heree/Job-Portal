import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { JobSearchPage } from "./JobSearchPage";
import * as jobsApi from "../../api/jobs";

vi.mock("../../api/jobs");

const MOCK_JOB = {
  id: "job-1",
  hr_id: "hr-1",
  company_name: "Acme Corp",
  title: "Backend Engineer",
  description: "Build things",
  skills: ["Python"],
  location: "Remote",
  employment_type: "FULL_TIME" as const,
  min_experience_years: null,
  max_experience_years: null,
  salary_min: null,
  salary_max: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <JobSearchPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("JobSearchPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("renders the jobs returned by the API", async () => {
    vi.mocked(jobsApi.searchJobs).mockResolvedValue({
      items: [MOCK_JOB],
      total: 1,
      page: 1,
      page_size: 10,
      pages: 1,
    });

    renderPage();

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
  });

  it("shows an empty state when no jobs match", async () => {
    vi.mocked(jobsApi.searchJobs).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      pages: 0,
    });

    renderPage();

    expect(await screen.findByText("No jobs found")).toBeInTheDocument();
  });

  it("re-queries with the search term after the user types", async () => {
    vi.mocked(jobsApi.searchJobs).mockResolvedValue({
      items: [MOCK_JOB],
      total: 1,
      page: 1,
      page_size: 10,
      pages: 1,
    });

    renderPage();
    await screen.findByText("Backend Engineer");

    await userEvent.type(screen.getByLabelText("Search"), "Backend");

    await waitFor(() =>
      expect(jobsApi.searchJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "Backend", page: 1 })
      )
    );
  });
});
