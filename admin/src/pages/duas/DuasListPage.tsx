import ContentListPage from '../../components/content/ContentListPage';
import { useCategoryOptions } from '../../lib/useRelationOptions';
import type { Dua } from '../../lib/types';

export default function DuasListPage() {
  const { options: categoryOptions } = useCategoryOptions('dua');

  return (
    <ContentListPage<Dua>
      apiKey="duas"
      title="Duas"
      description="Supplications shown across the app, optionally linked to a ritual step."
      newHref="/duas/new"
      editHref={(item) => `/duas/${item.id}`}
      extraFilters={[
        {
          key: 'ritualType',
          label: 'Ritual',
          options: [
            { value: 'hajj', label: 'Hajj' },
            { value: 'umrah', label: 'Umrah' },
          ],
        },
        {
          key: 'category',
          label: 'Category',
          options: categoryOptions,
        },
      ]}
      columns={[
        {
          header: 'Title',
          cell: (item) => (
            <div>
              <div className="font-medium text-slate-800">{item.title.english || item.title.malayalam}</div>
              <div className="text-xs text-slate-500">{item.title.malayalam}</div>
            </div>
          ),
        },
        {
          header: 'Category',
          cell: (item) => <span className="badge bg-slate-100 text-slate-600">{item.category}</span>,
        },
        {
          header: 'Ritual',
          cell: (item) => <span className="text-xs text-slate-500">{item.ritualType}</span>,
        },
        {
          header: 'Order',
          cell: (item) => <span className="text-slate-500">{item.order}</span>,
        },
      ]}
      detailFields={[
        {
          header: 'Title',
          cell: (item) => (
            <div className="space-y-0.5">
              {item.title.english && <div>{item.title.english}</div>}
              <div>{item.title.malayalam}</div>
            </div>
          ),
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
        {
          header: 'Category',
          cell: (item) => item.category,
        },
        {
          header: 'Ritual',
          cell: (item) => item.ritualType,
        },
        {
          header: 'Order',
          cell: (item) => item.order,
        },
      ]}
    />
  );
}
