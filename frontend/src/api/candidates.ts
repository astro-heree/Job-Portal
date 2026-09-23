import { apiClient } from "./client";
import type { CandidateProfile, CandidateStats, PaginatedResponse } from "../types";

export interface CandidateProfileUpdatePayload {
  phone?: string | null;
  headline?: string | null;
  experience_years?: number | null;
  skills?: string[];
  location?: string | null;
  expected_salary?: number | null;
}

export async function getMyProfile(): Promise<CandidateProfile> {
  const response = await apiClient.get<CandidateProfile>("/candidates/me");
  return response.data;
}

export async function updateMyProfile(payload: CandidateProfileUpdatePayload): Promise<CandidateProfile> {
  const response = await apiClient.patch<CandidateProfile>("/candidates/me", payload);
  return response.data;
}

export async function getMyStats(): Promise<CandidateStats> {
  const response = await apiClient.get<CandidateStats>("/candidates/me/stats");
  return response.data;
}

export async function uploadResume(file: File): Promise<CandidateProfile> {
  const formData = new FormData();
  formData.append("file", file);
  // No explicit Content-Type here -- the browser must set it (including the
  // multipart boundary) when sending a FormData body; setting it manually
  // without a boundary produces a request the server can't parse.
  const response = await apiClient.post<CandidateProfile>("/candidates/me/resume", formData);
  return response.data;
}

export async function downloadMyResume(): Promise<Blob> {
  const response = await apiClient.get("/candidates/me/resume", { responseType: "blob" });
  return response.data;
}

export interface CandidateSearchParams {
  q?: string;
  skills?: string[];
  location?: string;
  min_experience_years?: number;
  max_salary?: number;
  page?: number;
  page_size?: number;
}

export async function searchCandidates(
  params: CandidateSearchParams
): Promise<PaginatedResponse<CandidateProfile>> {
  const response = await apiClient.get<PaginatedResponse<CandidateProfile>>("/candidates", { params });
  return response.data;
}

export async function getCandidate(candidateId: string): Promise<CandidateProfile> {
  const response = await apiClient.get<CandidateProfile>(`/candidates/${candidateId}`);
  return response.data;
}

export async function downloadCandidateResume(candidateId: string): Promise<Blob> {
  const response = await apiClient.get(`/candidates/${candidateId}/resume`, { responseType: "blob" });
  return response.data;
}
