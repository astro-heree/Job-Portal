export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 py-12 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}
