import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiEye, FiEdit2, FiUpload, FiEyeOff, FiTrash2, FiXOctagon, FiRotateCcw } from 'react-icons/fi';
import { api } from '../../lib/api';
import type { ListMeta } from '../../lib/types';
import { useToast, errorMessage } from '../../lib/toast';
import ConfirmDialog from '../ConfirmDialog';
import Spinner from '../Spinner';
import FilterSelect from '../fields/FilterSelect';
import Pagination from './Pagination';
import PublishBadge from './PublishBadge';

export interface Column<T> {
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ContentListPageProps<T extends { id: string; isPublished: boolean; deletedAt: string | null }> {
  apiKey: string;
  title: string;
  description?: string;
  columns: Column<T>[];
  /** Fields shown in the "View" detail modal. Defaults to `columns`, but list columns are often
   *  trimmed/truncated for table width — pass this to show the full, untruncated content instead. */
  detailFields?: Column<T>[];
  newHref?: string;
  editHref: (item: T) => string;
  extraFilters?: FilterOption[];
  /** Pre-selects an extraFilters value on first render, e.g. when a link already narrows the list (sidebar submenu). */
  defaultFilterValues?: Record<string, string>;
  pageSize?: number;
}

export default function ContentListPage<T extends { id: string; isPublished: boolean; deletedAt: string | null }>({
  apiKey,
  title,
  description,
  columns,
  detailFields,
  newHref,
  editHref,
  extraFilters = [],
  defaultFilterValues,
  pageSize = 50,
}: ContentListPageProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(defaultFilterValues ?? {});
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [hardDelete, setHardDelete] = useState(false);
  const [viewingItem, setViewingItem] = useState<T | null>(null);

  const queryClient = useQueryClient();
  const { push } = useToast();

  const query = useQuery({
    queryKey: ['content', apiKey, page, search, publishedFilter, includeDeleted, filterValues],
    queryFn: async () => {
      const { data, meta } = await api.get<T[]>(`/api/admin/${apiKey}`, {
        page,
        limit: pageSize,
        search: search || undefined,
        isPublished: publishedFilter === 'all' ? undefined : publishedFilter,
        includeDeleted: includeDeleted || undefined,
        ...filterValues,
      });
      return { items: data, meta };
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['content', apiKey] });

  const togglePublish = useMutation({
    mutationFn: (item: T) => api.patch(`/api/admin/${apiKey}/${item.id}`, { isPublished: !item.isPublished }),
    onSuccess: () => {
      invalidate();
      push('Updated');
    },
    onError: (err) => push(errorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      hardDelete
        ? api.delete(`/api/admin/${apiKey}/${pendingDelete!.id}`, { hard: true })
        : api.delete(`/api/admin/${apiKey}/${pendingDelete!.id}`),
    onSuccess: () => {
      invalidate();
      push(hardDelete ? 'Permanently deleted' : 'Deleted');
      setPendingDelete(null);
    },
    onError: (err) => {
      push(errorMessage(err), 'error');
      setPendingDelete(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (item: T) => api.post(`/api/admin/${apiKey}/${item.id}/restore`),
    onSuccess: () => {
      invalidate();
      push('Restored');
    },
    onError: (err) => push(errorMessage(err), 'error'),
  });

  const items = query.data?.items ?? [];
  const meta: ListMeta | undefined = query.data?.meta;
  const startSlNo = ((meta?.page ?? page) - 1) * pageSize + 1;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {newHref && (
          <Link to={newHref} className="btn-primary">
            + New
          </Link>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          className="input min-w-[220px] flex-[2]"
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <FilterSelect
          value={publishedFilter}
          onChange={(v) => {
            setPublishedFilter(v as typeof publishedFilter);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'true', label: 'Published only' },
            { value: 'false', label: 'Drafts only' },
          ]}
        />
        {extraFilters.map((f) => (
          <FilterSelect
            key={f.key}
            value={filterValues[f.key] || ''}
            onChange={(v) => {
              setFilterValues((prev) => ({ ...prev, [f.key]: v }));
              setPage(1);
            }}
            options={[{ value: '', label: `${f.label}: all` }, ...f.options]}
          />
        ))}
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked);
              setPage(1);
            }}
          />
          Show deleted
        </label>
      </div>

      <div className="card overflow-hidden">
        {query.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Nothing here yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur">
                <tr>
                  <th className="w-14 px-3 py-2.5">Sl No.</th>
                  {columns.map((col) => (
                    <th key={col.header} className={`px-3 py-2.5 ${col.className || ''}`}>
                      {col.header}
                    </th>
                  ))}
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="px-3 py-2.5 text-slate-500">{startSlNo + index}</td>
                    {columns.map((col) => (
                      <td key={col.header} className={`px-3 py-2.5 align-top ${col.className || ''}`}>
                        {col.cell(item)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 align-top">
                      <PublishBadge isPublished={item.isPublished} deletedAt={item.deletedAt} />
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex justify-end gap-1.5">
                        {item.deletedAt ? (
                          <button
                            className="btn-ghost"
                            title="Restore"
                            aria-label="Restore"
                            onClick={() => restoreMutation.mutate(item)}
                          >
                            <FiRotateCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-ghost"
                              title="View"
                              aria-label="View"
                              onClick={() => setViewingItem(item)}
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                            <Link to={editHref(item)} className="btn-ghost" title="Edit" aria-label="Edit">
                              <FiEdit2 className="h-4 w-4" />
                            </Link>
                            <button
                              className="btn-ghost"
                              title={item.isPublished ? 'Unpublish' : 'Publish'}
                              aria-label={item.isPublished ? 'Unpublish' : 'Publish'}
                              onClick={() => togglePublish.mutate(item)}
                            >
                              {item.isPublished ? <FiEyeOff className="h-4 w-4" /> : <FiUpload className="h-4 w-4" />}
                            </button>
                            <button
                              className="btn-ghost text-red-600 hover:bg-red-50"
                              title="Delete"
                              aria-label="Delete"
                              onClick={() => {
                                setHardDelete(false);
                                setPendingDelete(item);
                              }}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {item.deletedAt && (
                          <button
                            className="btn-ghost text-red-600 hover:bg-red-50"
                            title="Delete forever"
                            aria-label="Delete forever"
                            onClick={() => {
                              setHardDelete(true);
                              setPendingDelete(item);
                            }}
                          >
                            <FiXOctagon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={hardDelete ? 'Delete permanently?' : 'Delete this item?'}
        description={
          hardDelete
            ? 'This cannot be undone and the app will not learn about it via sync.'
            : 'It will stop appearing in the app and can be restored later.'
        }
        confirmLabel={hardDelete ? 'Delete forever' : 'Delete'}
        danger
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setPendingDelete(null)}
      />

      {viewingItem && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm"
          onClick={() => setViewingItem(null)}
        >
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{title.replace(/s$/, '')} details</h3>
                <p className="text-xs text-slate-500">Full content view</p>
              </div>
              <PublishBadge isPublished={viewingItem.isPublished} deletedAt={viewingItem.deletedAt} />
            </div>

            <div className="space-y-4">
              {(detailFields ?? columns).map((col) => (
                <div key={col.header}>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{col.header}</div>
                  <div className="whitespace-pre-wrap text-sm text-slate-800">{col.cell(viewingItem)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
