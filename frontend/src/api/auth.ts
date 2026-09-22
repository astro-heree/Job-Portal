import { apiClient } from "./client";
import type { AuthResponse, User, UserRole } from "../types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  company_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}
