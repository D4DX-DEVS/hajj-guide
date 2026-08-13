import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import ContentListPage from '../../components/content/ContentListPage';
import type { Category } from '../../lib/types';
import { CATEGORY_GROUPS, categoryGroupLabel } from '../../lib/categoryGroups';

/** Landing table: one row per field, click through to that field's categories. */
function CategoryFieldsTable() {
  const counts = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const results = await Promise.all(
        CATEGORY_GROUPS.map((g) => api.get<Category[]>('/api/admin/categories', { group: g.value, limit: 1 })),
      );
      return Object.fromEntries(CATEGORY_GROUPS.map((g, i) => [g.value, results[i].meta?.total ?? 0]));
    },
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-slate-900">Categories</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Category values used by Ritual Steps, Duas, Guide Topics and Emergency Contacts. Click a field to manage its
          categories.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/95 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Field</th>
              <th className="px-3 py-2.5">Categories</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CATEGORY_GROUPS.map((g) => (
              <tr key={g.value} className="transition-colors hover:bg-brand-50/40">
                <td className="px-3 py-2.5 font-medium text-slate-800">{g.label}</td>
                <td className="px-3 py-2.5 text-slate-500">{counts.data?.[g.value] ?? (counts.isLoading ? '…' : 0)}</td>
                <td className="px-3 py-2.5 text-right">
                  <Link to={`/categories?group=${g.value}`} className="btn-ghost">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CategoriesListPage() {
  const [searchParams] = useSearchParams();
  const groupParam = searchParams.get('group') || '';
  const group = CATEGORY_GROUPS.find((g) => g.value === groupParam)?.value;

  if (!group) return <CategoryFieldsTable />;

  const groupLabel = categoryGroupLabel(group);

  return (
    <div>
      <Link to="/categories" className="mb-2 inline-block text-xs text-slate-500 hover:text-slate-700">
        ← All fields
      </Link>

      <ContentListPage<Category>
        key={group}
        apiKey="categories"
        title={`${groupLabel} Categories`}
        description={`Categories used by ${groupLabel}. Add, edit or delete them here.`}
        newHref={`/categories/new?group=${group}`}
        editHref={(item) => `/categories/${item.id}`}
        defaultFilterValues={{ group }}
        columns={[
          {
            header: 'Label',
            cell: (item) => <div className="font-medium text-slate-800">{item.label.english || item.label.malayalam}</div>,
          },
          {
            header: 'Key',
            cell: (item) => <span className="font-mono text-xs text-slate-500">{item.key}</span>,
          },
          {
            header: 'Order',
            cell: (item) => <span className="text-slate-500">{item.order}</span>,
          },
        ]}
      />
    </div>
  );
}
