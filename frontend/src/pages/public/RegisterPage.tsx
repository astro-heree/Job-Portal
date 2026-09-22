import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField, FormSelect } from "../../components/FormField";
import { getErrorMessage, getFieldErrors } from "../../api/client";
import { homePathForRole, useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  company_name?: string;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CANDIDATE");
  const [companyName, setCompanyName] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.full_name = "Full name is required.";
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
    if (role === "HR" && !companyName.trim()) errors.company_name = "Company name is required for HR accounts.";
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        ...(role === "HR" ? { company_name: companyName.trim() } : {}),
      });
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      // Server-side validation is the source of truth; surface any field-
      // level messages it returns, in addition to the general message.
      const serverFields = getFieldErrors(err);
      const mapped: FieldErrors = {};
      for (const [key, messages] of Object.entries(serverFields)) {
        if (key === "email" || key === "password" || key === "full_name" || key === "company_name") {
          mapped[key as keyof FieldErrors] = messages.join(" ");
        }
      }
      setFieldErrors(mapped);
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Create your account</h1>
        <p className="mb-6 text-sm text-slate-500">Join Job Portal as an HR or Candidate</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <ErrorBanner message={formError} />

          <FormSelect
            label="I am registering as"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="CANDIDATE">Candidate</option>
            <option value="HR">HR</option>
          </FormSelect>

          <FormField
            label="Full name"
            name="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.full_name}
          />

          {role === "HR" && (
            <FormField
              label="Company name"
              name="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={fieldErrors.company_name}
            />
          )}

          <FormField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />

          <FormField
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          <FormField
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
