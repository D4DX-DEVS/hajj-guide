import ContentListPage from '../../components/content/ContentListPage';
import type { Audio } from '../../lib/types';

function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioLibraryPage() {
  return (
    <ContentListPage<Audio>
      apiKey="audio"
      title="Audio Library"
      description="Recitations and narrations used across duas and guide topics."
      newHref="/audio/new"
      editHref={(item) => `/audio/${item.id}`}
      extraFilters={[
        {
          key: 'type',
          label: 'Type',
          options: [
            { value: 'talbiyah', label: 'Talbiyah' },
            { value: 'dua', label: 'Dua' },
            { value: 'guide', label: 'Guide' },
          ],
        },
      ]}
      columns={[
        {
          header: 'Title',
          cell: (item) => (
            <div>
              <div className="font-medium text-slate-800">{item.title.english || item.title.malayalam}</div>
              {item.reciter && <div className="text-xs text-slate-500">{item.reciter}</div>}
            </div>
          ),
        },
        { header: 'Type', cell: (item) => <span className="badge bg-slate-100 text-slate-600">{item.type}</span> },
        { header: 'Duration', cell: (item) => formatDuration(item.durationSeconds) },
      ]}
    />
  );
}
