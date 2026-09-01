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
      ]}
    />
  );
}
