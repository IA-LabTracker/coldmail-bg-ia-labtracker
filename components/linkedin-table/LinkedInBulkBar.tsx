interface LinkedInBulkBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}

export function LinkedInBulkBar({ count, onDelete, onClear }: LinkedInBulkBarProps) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{count} selected</span>
        <button
          onClick={onDelete}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete Selected
        </button>
        <button
          onClick={onClear}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
