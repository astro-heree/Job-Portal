import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { MyJobsPage } from "./MyJobsPage";
import * as hrApi from "../../api/hr";
import * as jobsApi from "../../api/jobs";

vi.mock("../../api/hr");
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
        <MyJobsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("MyJobsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("shows a loading state, then the HR's jobs", async () => {
    vi.mocked(hrApi.listMyJobs).mockResolvedValue({
      items: [MOCK_JOB],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1,
    });

    renderPage();

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows an empty state when the HR has no jobs", async () => {
    vi.mocked(hrApi.listMyJobs).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      pages: 0,
    });

    renderPage();

    expect(await screen.findByText("No jobs posted yet")).toBeInTheDocument();
  });

  it("deactivating a job calls the API and updates the badge", async () => {
    vi.mocked(hrApi.listMyJobs).mockResolvedValue({
      items: [MOCK_JOB],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1,
    });
    vi.mocked(jobsApi.setJobStatus).mockResolvedValue({ ...MOCK_JOB, is_active: false });

    renderPage();
    await screen.findByText("Backend Engineer");

    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(jobsApi.setJobStatus).toHaveBeenCalledWith("job-1", false));
    expect(await screen.findByText("Inactive")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
  });
});
