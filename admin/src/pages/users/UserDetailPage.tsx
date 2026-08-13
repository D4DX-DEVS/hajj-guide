import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { AppUser, UserProgress, UserPreferences } from '../../lib/types';
import Spinner from '../../components/Spinner';

interface UserDetail {
  user: AppUser;
  progress: UserProgress[];
  bookmarkCount: number;
  checkedItems: number;
  hasTent: boolean;
  preferences: UserPreferences | null;
}

export default function UserDetailPage() {
  const { id } = useParams();

  const query = useQuery({
    queryKey: ['user-detail', id],
    queryFn: async () => (await api.get<UserDetail>(`/api/admin/users/${id}`)).data,
  });

  if (query.isLoading || !query.data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const { user, progress, bookmarkCount, checkedItems, hasTent, preferences } = query.data;

  return (
    <div>
      <Link to="/users" className="text-xs text-slate-500 hover:text-slate-700">
        ← Back
      </Link>
      <h1 className="mt-1 mb-5 text-lg font-semibold text-slate-900">{user.displayName || user.email || 'Pilgrim'}</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card space-y-2 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Profile</h2>
          <Row label="Email" value={user.email || '—'} />
          <Row label="Firebase UID" value={user.firebaseUid} mono />
          <Row label="Provider" value={user.provider || '—'} />
          <Row label="Platform" value={`${user.platform || '—'} ${user.appVersion || ''}`} />
          <Row label="Language" value={user.language} />
          <Row label="Joined" value={new Date(user.createdAt).toLocaleString()} />
          <Row label="Last seen" value={new Date(user.lastSeenAt).toLocaleString()} />
        </div>

        <div className="card space-y-2 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Activity summary</h2>
          <Row label="Bookmarks" value={String(bookmarkCount)} />
          <Row label="Checklist items ticked" value={String(checkedItems)} />
          <Row label="My-tent location saved" value={hasTent ? 'Yes' : 'No'} />
          {preferences && (
            <>
              <Row label="Theme" value={preferences.theme} />
              <Row label="Font scale" value={String(preferences.fontScale)} />
            </>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Ritual progress</h2>
          {progress.length === 0 ? (
            <p className="text-sm text-slate-400">No progress recorded.</p>
          ) : (
            <div className="space-y-2">
              {progress.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-medium capitalize text-slate-700">{p.ritualType}</span>
                  <span className="text-slate-500">
                    {p.completedStepIds.length} steps completed · current index {p.currentStepIndex}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
