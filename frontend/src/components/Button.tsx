import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:hover:bg-brand-600",
  secondary:
    "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:hover:bg-white",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:hover:bg-red-600",
  ghost: "text-brand-600 hover:bg-brand-50 disabled:hover:bg-transparent",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

/** Computes the same visual classes `Button` uses, for anything that can't
 * be a real `<button>` -- most often a react-router `Link` styled to look
 * like one (e.g. "Post a job" navigating to a create-job route). */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = ""
): string {
  return [
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-60",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ].join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
});
