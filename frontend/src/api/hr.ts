import { apiClient } from "./client";
import type { HRDashboardStats, HRProfile, Job, PaginatedResponse } from "../types";

export interface HRProfileUpdatePayload {
  company_name?: string;
  designation?: string | null;
}

export async function getMyProfile(): Promise<HRProfile> {
  const response = await apiClient.get<HRProfile>("/hr/me");
  return response.data;
}

export async function updateMyProfile(payload: HRProfileUpdatePayload): Promise<HRProfile> {
  const response = await apiClient.patch<HRProfile>("/hr/me", payload);
  return response.data;
}

export async function listMyJobs(page: number, pageSize = 20): Promise<PaginatedResponse<Job>> {
  const response = await apiClient.get<PaginatedResponse<Job>>("/hr/jobs", {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

export async function getDashboardStats(): Promise<HRDashboardStats> {
  const response = await apiClient.get<HRDashboardStats>("/hr/dashboard/stats");
  return response.data;
}
