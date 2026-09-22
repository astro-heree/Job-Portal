import { apiClient } from "./client";
import type { ApplicantOut, ApplicationOut, EmploymentType, Job, JobFormValues, PaginatedResponse } from "../types";

export interface JobSearchParams {
  q?: string;
  skills?: string[];
  location?: string;
  employment_type?: EmploymentType;
  experience_years?: number;
  page?: number;
  page_size?: number;
}

export async function searchJobs(params: JobSearchParams): Promise<PaginatedResponse<Job>> {
  const response = await apiClient.get<PaginatedResponse<Job>>("/jobs", { params });
  return response.data;
}

export async function getJob(jobId: string): Promise<Job> {
  const response = await apiClient.get<Job>(`/jobs/${jobId}`);
  return response.data;
}

export async function createJob(payload: JobFormValues): Promise<Job> {
  const response = await apiClient.post<Job>("/jobs", payload);
  return response.data;
}

export async function updateJob(jobId: string, payload: Partial<JobFormValues>): Promise<Job> {
  const response = await apiClient.patch<Job>(`/jobs/${jobId}`, payload);
  return response.data;
}

export async function setJobStatus(jobId: string, isActive: boolean): Promise<Job> {
  const response = await apiClient.patch<Job>(`/jobs/${jobId}/status`, { is_active: isActive });
  return response.data;
}

export async function applyToJob(jobId: string, coverNote: string): Promise<ApplicationOut> {
  const response = await apiClient.post<ApplicationOut>(`/jobs/${jobId}/apply`, {
    cover_note: coverNote || null,
  });
  return response.data;
}

export interface ApplicantFilterParams {
  status?: string;
  q?: string;
  min_ats_rating?: number;
  page?: number;
  page_size?: number;
}

export async function listJobApplicants(
  jobId: string,
  params: ApplicantFilterParams
): Promise<PaginatedResponse<ApplicantOut>> {
  const response = await apiClient.get<PaginatedResponse<ApplicantOut>>(`/jobs/${jobId}/applications`, {
    params,
  });
  return response.data;
}
