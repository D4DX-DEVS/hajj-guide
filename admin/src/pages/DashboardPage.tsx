import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { DashboardData } from '../lib/types';
import Spinner from '../components/Spinner';

const ROUTE_BY_KEY: Record<string, string> = {
  'ritual-steps': '/ritual-steps',
  duas: '/duas',
  'guide-topics': '/guide-topics',
  'tawaf-duas': '/tawaf-duas',
  'sai-duas': '/sai-duas',
  'checklist-template': '/checklist-template',
  'emergency-contacts': '/emergency-contacts',
  audio: '/audio',
  categories: '/categories',
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardData>('/api/admin/dashboard')).data,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-slate-900">Dashboard</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total users" value={data.users.total} />
        <StatCard label="New this week" value={data.users.newThisWeek} />
        <StatCard label="Active today" value={data.users.activeToday} />
      </div>

      <div className="mb-6 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Content</h2>
          {data.totalDrafts > 0 && (
            <span className="badge bg-amber-100 text-amber-700">{data.totalDrafts} drafts across all types</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.content.map((c) => (
            <Link
              key={c.key}
              to={ROUTE_BY_KEY[c.key] || '/'}
              className="rounded-lg border border-slate-200 p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
            >
              <div className="text-xs text-slate-500">{c.label}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{c.published}</div>
              {c.drafts > 0 && <div className="text-xs text-amber-600">{c.drafts} draft{c.drafts === 1 ? '' : 's'}</div>}
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent edits</h2>
        {data.recentEdits.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recentEdits.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium text-slate-700">{entry.adminEmail || 'unknown'}</span>{' '}
                  <span className="text-slate-500">
                    {entry.action} {entry.collectionName}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{new Date(entry.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card border-l-2 border-l-brand-400 p-4 transition-shadow hover:shadow-md">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}
