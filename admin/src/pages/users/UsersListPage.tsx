import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { AppUser, ListMeta } from '../../lib/types';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/content/Pagination';
import Segmented from '../../components/fields/Segmented';

export default function UsersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');

  const query = useQuery({
    queryKey: ['users', page, search, platform],
    queryFn: async () => {
      const { data, meta } = await api.get<AppUser[]>('/api/admin/users', {
        page,
        limit: 50,
        search: search || undefined,
        platform: platform || undefined,
      });
      return { items: data, meta };
    },
  });

  const items = query.data?.items ?? [];
  const meta: ListMeta | undefined = query.data?.meta;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Users</h1>
      <p className="mb-5 text-sm text-slate-500">Read-only — pilgrims sign in through the app with Google or Apple.</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className="input w-full sm:max-w-xs"
          placeholder="Search name, email, uid…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Segmented
          value={platform}
          onChange={(v) => {
            setPlatform(v);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All platforms' },
            { value: 'android', label: 'Android' },
            { value: 'ios', label: 'iOS' },
          ]}
        />
      </div>

      <div className="card overflow-hidden">
        {query.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No users yet.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur">
              <tr>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Platform</th>
                <th className="px-3 py-2.5">Language</th>
                <th className="px-3 py-2.5">Last seen</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-3 py-2.5 font-medium text-slate-800">{u.displayName || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-600">{u.email || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-500">{u.platform || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-500">{u.language}</td>
                  <td className="px-3 py-2.5 text-slate-500">{new Date(u.lastSeenAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Link to={`/users/${u.id}`} className="btn-ghost">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
