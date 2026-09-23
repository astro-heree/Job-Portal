import { Link } from "react-router-dom";
import { BriefcaseIcon } from "./icons";

interface BrandMarkProps {
  size?: "sm" | "lg";
  showLabel?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, { box: string; icon: string; label: string }> = {
  sm: { box: "h-9 w-9 rounded-xl", icon: "h-5 w-5", label: "text-lg" },
  lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7", label: "text-2xl" },
};

export function BrandMark({ size = "sm", showLabel = true }: BrandMarkProps) {
  const classes = SIZE_CLASSES[size];
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20 ${classes.box}`}
      >
        <BriefcaseIcon className={classes.icon} />
      </span>
      {showLabel && (
        <span className={`font-bold tracking-tight text-slate-900 ${classes.label}`}>Job Portal</span>
      )}
    </Link>
  );
}
