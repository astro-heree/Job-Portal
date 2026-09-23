export type UserRole = "HR" | "CANDIDATE";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

export type ApplicationStatus = "APPLIED" | "SHORTLISTED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Job {
  id: string;
  hr_id: string;
  company_name: string | null;
  title: string;
  description: string;
  skills: string[];
  location: string;
  employment_type: EmploymentType;
  min_experience_years: number | null;
  max_experience_years: number | null;
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobFormValues {
  title: string;
  description: string;
  skills: string[];
  location: string;
  employment_type: EmploymentType;
  min_experience_years: number | null;
  max_experience_years: number | null;
  salary_min: number | null;
  salary_max: number | null;
}

export interface ApplicationOut {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  updated_at: string;
  ats_score: number;
  ats_rating: number;
}

export interface ApplicantOut extends ApplicationOut {
  candidate_full_name: string;
  candidate_email: string;
  candidate_headline: string | null;
  candidate_skills: string[];
  candidate_experience_years: number | null;
  candidate_location: string | null;
  has_resume: boolean;
}

export interface CandidateApplicationOut extends ApplicationOut {
  job_title: string;
  company_name: string | null;
  job_location: string;
  job_is_active: boolean;
}

export interface CandidateProfile {
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  headline: string | null;
  experience_years: number | null;
  skills: string[];
  location: string | null;
  expected_salary: number | null;
  has_resume: boolean;
}

export interface CandidateStats {
  total_applications: number;
  applied_count: number;
  shortlisted_count: number;
  rejected_count: number;
  unread_messages: number;
}

export interface HRProfile {
  user_id: string;
  email: string;
  full_name: string;
  company_name: string;
  designation: string | null;
}

export interface ApplicationsTrendPoint {
  date: string;
  count: number;
}

export interface HRDashboardStats {
  total_jobs: number;
  active_jobs: number;
  total_applicants: number;
  applied_count: number;
  shortlisted_count: number;
  rejected_count: number;
  applications_trend: ApplicationsTrendPoint[];
}

export interface Message {
  id: string;
  sender_hr_id: string;
  sender_company_name: string | null;
  subject: string;
  body: string;
  sent_at: string;
  read_at: string | null;
}
