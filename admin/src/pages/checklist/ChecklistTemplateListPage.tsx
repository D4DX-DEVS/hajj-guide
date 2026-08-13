import ContentListPage from '../../components/content/ContentListPage';
import type { ChecklistTemplate } from '../../lib/types';

export default function ChecklistTemplateListPage() {
  return (
    <ContentListPage<ChecklistTemplate>
      apiKey="checklist-template"
      title="Checklist Template"
      description="Trip-prep categories. Each holds a list of items pilgrims tick off."
      newHref="/checklist-template/new"
      editHref={(item) => `/checklist-template/${item.id}`}
      columns={[
        {
          header: 'Category',
          cell: (item) => (
            <div>
              <div className="font-medium text-slate-800">
                {item.iconEmoji} {item.name.english || item.name.malayalam}
              </div>
              <div className="text-xs text-slate-500">{item.categoryKey}</div>
            </div>
          ),
        },
        {
          header: 'Items',
          cell: (item) => <span className="text-xs text-slate-500">{item.items.length}</span>,
        },
      ]}
      detailFields={[
        {
          header: 'Category',
          cell: (item) => (
            <div>
              <div className="font-medium text-slate-800">
                {item.iconEmoji} {item.name.english || item.name.malayalam}
              </div>
              <div className="text-xs text-slate-500">{item.categoryKey}</div>
            </div>
          ),
        },
        {
          header: 'Items',
          cell: (item) =>
            item.items.length ? (
              <ol className="list-decimal space-y-1 pl-4">
                {[...item.items]
                  .sort((a, b) => a.order - b.order)
                  .map((i) => (
                    <li key={i.key}>
                      <div>
                        {i.iconEmoji} {i.title.english || i.title.malayalam}
                      </div>
                      {i.note && (i.note.english || i.note.malayalam) && (
                        <div className="text-xs text-slate-500">{i.note.english || i.note.malayalam}</div>
                      )}
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
