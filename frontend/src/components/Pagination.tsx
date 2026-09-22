interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-slate-500">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
