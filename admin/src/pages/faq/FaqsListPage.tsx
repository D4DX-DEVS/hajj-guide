import ContentListPage from '../../components/content/ContentListPage';
import type { Faq } from '../../lib/types';

export default function FaqsListPage() {
  return (
    <ContentListPage<Faq>
      apiKey="faqs"
      title="FAQ"
      description="Frequently asked questions shown in the app."
      newHref="/faqs/new"
      editHref={(item) => `/faqs/${item.id}`}
      columns={[
        {
          header: 'Title',
          cell: (item) => (
            <div>
              <div className="font-medium text-slate-800">{item.title.english || item.title.malayalam}</div>
              {item.title.english && <div className="text-xs text-slate-500">{item.title.malayalam}</div>}
            </div>
          ),
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
              {item.title.arabic && <div dir="rtl">{item.title.arabic}</div>}
            </div>
          ),
        },
        {
          header: 'Description',
          cell: (item) =>
            item.description ? (
              <div className="space-y-0.5">
                {item.description.english && <div className="rte-content" dangerouslySetInnerHTML={{ __html: item.description.english }} />}
                {item.description.malayalam && <div className="rte-content" dangerouslySetInnerHTML={{ __html: item.description.malayalam }} />}
                {item.description.arabic && <div dir="rtl">{item.description.arabic}</div>}
              </div>
            ) : (
              '—'
            ),
        },
        {
          header: 'Order',
          cell: (item) => item.order,
        },
      ]}
    />
  );
}
