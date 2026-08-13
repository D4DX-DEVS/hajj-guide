import ContentListPage from '../../components/content/ContentListPage';
import { useCategoryOptions, useRelationOptions, duaLabel } from '../../lib/useRelationOptions';
import type { RitualStep } from '../../lib/types';

export default function RitualStepsListPage() {
  const { options: categoryOptions } = useCategoryOptions('ritual-step');
  const { options: duaOptions } = useRelationOptions('/api/admin/duas', duaLabel);

  return (
    <ContentListPage<RitualStep>
      apiKey="ritual-steps"
      title="Ritual Steps"
      description="The step-by-step flow shown for Hajj and Umrah."
      newHref="/ritual-steps/new"
      editHref={(item) => `/ritual-steps/${item.id}`}
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
          header: 'Step',
          cell: (item) => (
            <span>
              <span className="badge mr-1.5 bg-slate-100 text-slate-600">{item.ritualType}</span>#{item.stepNumber}
            </span>
          ),
        },
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
          cell: (item) => (item.category ? <span className="badge bg-slate-100 text-slate-600">{item.category}</span> : <span className="text-xs text-slate-400">—</span>),
        },
      ]}
      detailFields={[
        {
          header: 'Step',
          cell: (item) => (
            <span>
              <span className="badge mr-1.5 bg-slate-100 text-slate-600">{item.ritualType}</span>#{item.stepNumber}
            </span>
          ),
        },
        {
          header: 'Title',
          cell: (item) => (
            <div className="space-y-0.5">
              {item.title.english && <div>{item.title.english}</div>}
              <div>{item.title.malayalam}</div>
              {item.title.arabic && (
                <div dir="rtl">{item.title.arabic}</div>
              )}
            </div>
          ),
        },
        {
          header: 'Category',
          cell: (item) => item.category || '—',
        },
        {
          header: 'Description',
          cell: (item) =>
            item.description ? (
              <div className="space-y-0.5">
                {item.description.english && <div className="rte-content" dangerouslySetInnerHTML={{ __html: item.description.english }} />}
                {item.description.malayalam && <div className="rte-content" dangerouslySetInnerHTML={{ __html: item.description.malayalam }} />}
                {/* arabic isn't exposed in the rich-text form (LocalizedInput excludes it), so it's always plain text */}
                {item.description.arabic && <div dir="rtl">{item.description.arabic}</div>}
              </div>
            ) : (
              '—'
            ),
        },
        {
          header: 'Instructions',
          cell: (item) =>
            item.instructions?.length ? (
              <ol className="list-decimal space-y-2 pl-4">
                {item.instructions.map((instr, i) => (
                  <li key={i} className="space-y-0.5">
                    {instr.english && <div>{instr.english}</div>}
                    <div>{instr.malayalam}</div>
                    {instr.arabic && <div dir="rtl">{instr.arabic}</div>}
                  </li>
                ))}
              </ol>
            ) : (
              '—'
            ),
        },
        {
          header: 'Linked duas',
          cell: (item) =>
            item.duaIds?.length ? (
              <ul className="list-disc space-y-0.5 pl-4">
                {item.duaIds.map((id) => (
                  <li key={id}>{duaOptions.find((d) => d.id === id)?.label || id}</li>
                ))}
              </ul>
            ) : (
              '—'
            ),
        },
      ]}
    />
  );
}
