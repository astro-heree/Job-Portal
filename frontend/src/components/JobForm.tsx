import { useState, type FormEvent } from "react";
import { ErrorBanner } from "./ErrorBanner";
import { FormField, FormSelect, FormTextArea } from "./FormField";
import type { EmploymentType, JobFormValues } from "../types";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];

interface JobFormProps {
  initialValues?: Partial<JobFormValues>;
  onSubmit: (values: JobFormValues) => Promise<void>;
  submitLabel: string;
  serverError?: string | null;
}

function toNumberOrNull(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function JobForm({ initialValues, onSubmit, submitLabel, serverError }: JobFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [skillsInput, setSkillsInput] = useState((initialValues?.skills ?? []).join(", "));
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initialValues?.employment_type ?? "FULL_TIME"
  );
  const [minExperience, setMinExperience] = useState(
    initialValues?.min_experience_years != null ? String(initialValues.min_experience_years) : ""
  );
  const [maxExperience, setMaxExperience] = useState(
    initialValues?.max_experience_years != null ? String(initialValues.max_experience_years) : ""
  );
  const [salaryMin, setSalaryMin] = useState(
    initialValues?.salary_min != null ? String(initialValues.salary_min) : ""
  );
  const [salaryMax, setSalaryMax] = useState(
    initialValues?.salary_max != null ? String(initialValues.salary_max) : ""
  );

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const minExp = toNumberOrNull(minExperience);
    const maxExp = toNumberOrNull(maxExperience);
    const salMin = toNumberOrNull(salaryMin);
    const salMax = toNumberOrNull(salaryMax);

    if (!title.trim() || !description.trim() || !location.trim()) {
      setValidationError("Title, description, and location are required.");
      return;
    }
    if (minExp != null && maxExp != null && maxExp < minExp) {
      setValidationError("Maximum experience must be greater than or equal to minimum experience.");
      return;
    }
    if (salMin != null && salMax != null && salMax < salMin) {
      setValidationError("Maximum salary must be greater than or equal to minimum salary.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        skills: skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        location: location.trim(),
        employment_type: employmentType,
        min_experience_years: minExp,
        max_experience_years: maxExp,
        salary_min: salMin,
        salary_max: salMax,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorBanner message={validationError ?? serverError ?? null} />

      <FormField label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <FormTextArea
        label="Description"
        rows={6}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <FormField
        label="Skills (comma-separated)"
        value={skillsInput}
        onChange={(e) => setSkillsInput(e.target.value)}
        placeholder="Python, FastAPI, PostgreSQL"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <FormSelect
          label="Employment type"
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
        >
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </FormSelect>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Min experience (years)"
          type="number"
          min={0}
          max={60}
          step="0.5"
          value={minExperience}
          onChange={(e) => setMinExperience(e.target.value)}
        />
        <FormField
          label="Max experience (years)"
          type="number"
          min={0}
          max={60}
          step="0.5"
          value={maxExperience}
          onChange={(e) => setMaxExperience(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Min salary ($)"
          type="number"
          min={0}
          value={salaryMin}
          onChange={(e) => setSalaryMin(e.target.value)}
        />
        <FormField
          label="Max salary ($)"
          type="number"
          min={0}
          value={salaryMax}
          onChange={(e) => setSalaryMax(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
