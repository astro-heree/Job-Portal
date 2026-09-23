export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      {label}
    </div>
  );
}
