import ContentListPage from '../../components/content/ContentListPage';
import { useCategoryOptions } from '../../lib/useRelationOptions';
import type { GuideTopic } from '../../lib/types';

export default function GuideTopicsListPage() {
  const { options: categoryOptions } = useCategoryOptions('guide-topic');

  return (
    <ContentListPage<GuideTopic>
      apiKey="guide-topics"
      title="Guide Topics"
      description="Long-form chapters — replaces the placeholder text in the app."
      newHref="/guide-topics/new"
      editHref={(item) => `/guide-topics/${item.id}`}
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
              <div className="font-medium text-slate-800">{item.mainTitle?.english || item.mainTitle?.malayalam || '(untitled)'}</div>
              {item.mainTitle?.english && item.mainTitle?.malayalam && (
                <div className="text-xs text-slate-500">{item.mainTitle.malayalam}</div>
              )}
            </div>
          ),
        },
        {
          header: 'Ritual',
          cell: (item) => <span className="text-xs text-slate-500">{item.ritualType}</span>,
        },
        {
          header: 'Category',
          cell: (item) =>
            item.category ? (
              <span className="badge bg-slate-100 text-slate-600">
                {categoryOptions.find((o) => o.value === item.category)?.label || item.category}
              </span>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            ),
        },
      ]}
      detailFields={[
        {
          header: 'Title',
          cell: (item) => (
            <div className="space-y-0.5">
              <div>{item.mainTitle?.english || item.mainTitle?.malayalam || '(untitled)'}</div>
              {item.mainTitle?.english && item.mainTitle?.malayalam && (
                <div className="text-xs text-slate-500">{item.mainTitle.malayalam}</div>
              )}
            </div>
          ),
        },
        {
          header: 'Ritual',
          cell: (item) => item.ritualType,
        },
        {
          header: 'Category',
          cell: (item) => categoryOptions.find((o) => o.value === item.category)?.label || item.category || '—',
        },
        {
          header: 'Sessions',
          cell: (item) =>
            item.sessions?.length ? (
              <ol className="list-decimal space-y-3 pl-4">
                {item.sessions.map((session, i) => (
                  <li key={i} className="space-y-0.5">
                    {session.sessionTitle && (
                      <div className="font-medium text-slate-800">
                        {session.sessionTitle.english || session.sessionTitle.malayalam}
                      </div>
                    )}
                    {session.description.english && <div className="rte-content" dangerouslySetInnerHTML={{ __html: session.description.english }} />}
                    {session.description.malayalam && <div className="rte-content" dangerouslySetInnerHTML={{ __html: session.description.malayalam }} />}
                  </li>
                ))}
              </ol>
            ) : (
              '—'
            ),
        },
      ]}
    />
  );
}
