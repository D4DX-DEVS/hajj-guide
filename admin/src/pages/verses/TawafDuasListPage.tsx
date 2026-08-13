import ContentListPage from '../../components/content/ContentListPage';
import type { TawafDua } from '../../lib/types';

export default function TawafDuasListPage() {
  return (
    <ContentListPage<TawafDua>
      apiKey="tawaf-duas"
      title="Tawaf Duas"
      description="Fixed set — one row per circuit (start, rounds 1-7, end). Edit rather than add new rows."
      editHref={(item) => `/tawaf-duas/${item.id}`}
      columns={[
        {
          header: 'Round',
          cell: (item) => <span className="badge bg-slate-100 text-slate-600">{item.roundNumber}</span>,
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
          header: 'Round',
          cell: (item) => <span className="badge bg-slate-100 text-slate-600">{item.roundNumber}</span>,
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
