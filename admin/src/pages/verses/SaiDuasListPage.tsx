import ContentListPage from '../../components/content/ContentListPage';
import type { SaiDua } from '../../lib/types';

export default function SaiDuasListPage() {
  return (
    <ContentListPage<SaiDua>
      apiKey="sai-duas"
      title="Sa'i Duas"
      description="Fixed set — one row per leg (1-7). Edit rather than add new rows."
      editHref={(item) => `/sai-duas/${item.id}`}
      columns={[
        {
          header: 'Leg',
          cell: (item) => (
            <span>
              <span className="badge mr-1.5 bg-slate-100 text-slate-600">#{item.leg}</span>
              <span className="text-xs text-slate-500">{item.direction}</span>
            </span>
          ),
        },
        {
          header: 'Label',
          cell: (item) => item.label?.english || item.label?.malayalam || '—',
        },
        {
          header: 'Arabic',
          cell: (item) => (
            <span dir="rtl" className="text-xs text-slate-500">
              {item.arabicText.slice(0, 40)}
              {item.arabicText.length > 40 ? '…' : ''}
            </span>
          ),
        },
      ]}
      detailFields={[
        {
          header: 'Leg',
          cell: (item) => (
            <span>
              <span className="badge mr-1.5 bg-slate-100 text-slate-600">#{item.leg}</span>
              <span className="text-xs text-slate-500">{item.direction}</span>
            </span>
          ),
        },
        {
          header: 'Label',
          cell: (item) => item.label?.english || item.label?.malayalam || '—',
        },
        {
          header: 'Arabic',
          cell: (item) => <div dir="rtl">{item.arabicText}</div>,
        },
        {
          header: 'Transliteration',
          cell: (item) =>
            item.transliteration ? (
              <div className="space-y-0.5">
                {item.transliteration.english && <div>{item.transliteration.english}</div>}
                {item.transliteration.malayalam && <div>{item.transliteration.malayalam}</div>}
              </div>
            ) : (
              '—'
            ),
        },
        {
          header: 'Meaning',
          cell: (item) =>
            item.meaning ? (
              <div className="space-y-0.5">
                {item.meaning.english && <div>{item.meaning.english}</div>}
                {item.meaning.malayalam && <div>{item.meaning.malayalam}</div>}
              </div>
            ) : (
              '—'
            ),
        },
      ]}
    />
  );
}
