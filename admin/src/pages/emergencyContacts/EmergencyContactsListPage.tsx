import ContentListPage from '../../components/content/ContentListPage';
import { useCategoryOptions } from '../../lib/useRelationOptions';
import type { EmergencyContact } from '../../lib/types';

export default function EmergencyContactsListPage() {
  const { options: categoryOptions } = useCategoryOptions('emergency-contact');

  return (
    <ContentListPage<EmergencyContact>
      apiKey="emergency-contacts"
      title="Emergency Contacts"
      description="Numbers shown on the SOS screen."
      newHref="/emergency-contacts/new"
      editHref={(item) => `/emergency-contacts/${item.id}`}
      extraFilters={[{ key: 'category', label: 'Category', options: categoryOptions }]}
      columns={[
        {
          header: 'Name',
          cell: (item) => (
            <div>
              <div className="font-medium text-slate-800">{item.name.english || item.name.malayalam}</div>
              <div className="text-xs text-slate-500">{item.number}</div>
            </div>
          ),
        },
        { header: 'Country', cell: (item) => item.country },
        { header: 'Category', cell: (item) => <span className="badge bg-slate-100 text-slate-600">{item.category}</span> },
        { header: 'Order', cell: (item) => <span className="text-slate-500">{item.order}</span> },
      ]}
    />
  );
}
