import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

const inputClasses =
  "rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({ label, error, id, className, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name ?? label;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error}>
      <input id={fieldId} className={`${inputClasses} ${className ?? ""}`} {...inputProps} />
    </FieldWrapper>
  );
}

type FormTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function FormTextArea({ label, error, id, className, ...textareaProps }: FormTextAreaProps) {
  const fieldId = id ?? textareaProps.name ?? label;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error}>
      <textarea id={fieldId} className={`${inputClasses} ${className ?? ""}`} {...textareaProps} />
    </FieldWrapper>
  );
}

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormSelect({ label, error, id, className, children, ...selectProps }: FormSelectProps) {
  const fieldId = id ?? selectProps.name ?? label;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error}>
      <select id={fieldId} className={`${inputClasses} ${className ?? ""}`} {...selectProps}>
        {children}
      </select>
    </FieldWrapper>
  );
}
