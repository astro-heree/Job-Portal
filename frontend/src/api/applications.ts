import { apiClient } from "./client";
import type { ApplicationOut, ApplicationStatus, CandidateApplicationOut, PaginatedResponse } from "../types";

export interface MyApplicationsParams {
  status?: ApplicationStatus;
  job_id?: string;
  page?: number;
  page_size?: number;
}

export async function listMyApplications(
  params: MyApplicationsParams
): Promise<PaginatedResponse<CandidateApplicationOut>> {
  const response = await apiClient.get<PaginatedResponse<CandidateApplicationOut>>("/applications/me", {
    params,
  });
  return response.data;
}

export async function getApplication(applicationId: string): Promise<ApplicationOut> {
  const response = await apiClient.get<ApplicationOut>(`/applications/${applicationId}`);
  return response.data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<ApplicationOut> {
  const response = await apiClient.patch<ApplicationOut>(`/applications/${applicationId}/status`, {
    status,
  });
  return response.data;
}

export async function bulkUpdateStatus(
  applicationIds: string[],
  status: ApplicationStatus
): Promise<ApplicationOut[]> {
  const response = await apiClient.patch<ApplicationOut[]>("/applications/bulk-status", {
    application_ids: applicationIds,
    status,
  });
  return response.data;
}
