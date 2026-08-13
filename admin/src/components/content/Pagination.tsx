import type { ListMeta } from '../../lib/types';

export default function Pagination({ meta, onPage }: { meta?: ListMeta; onPage: (page: number) => void }) {
  if (!meta || meta.pages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5 text-sm text-slate-600">
      <span>
        Page {meta.page} of {meta.pages} · {meta.total} total
      </span>
      <div className="flex gap-1.5">
        <button className="btn-secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </button>
        <button className="btn-secondary" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
