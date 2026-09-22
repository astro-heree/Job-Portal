import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8001";
const TOKEN_STORAGE_KEY = "jobportal_token";

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  // FastAPI expects repeated keys for array query params (?skills=a&skills=b),
  // not axios's default "skills[]=a&skills[]=b" -- indexes: null gives the
  // repeated-key form.
  paramsSerializer: { indexes: null },
});

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts;
    // the session simply won't persist across reloads in that case.
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) {
      return body.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}

export function getFieldErrors(error: unknown): Record<string, string[]> {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.fields ?? {};
  }
  return {};
}

/** Saves a Blob fetched via the authenticated axios client to disk. A plain
 * `<a href="/api/...">` can't be used for protected downloads like resumes --
 * a browser navigation sends no Authorization header, so it would just 401. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
