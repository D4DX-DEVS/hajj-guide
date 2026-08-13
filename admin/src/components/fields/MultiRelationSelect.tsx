import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import type { RelationOption } from '../../lib/useRelationOptions';

interface MultiRelationSelectProps {
  label: string;
  name: string;
  // See Toggle.tsx — Control<any> doesn't structurally accept concrete Control<T>.
  control: any;
  options: RelationOption[];
  loading?: boolean;
}

export default function MultiRelationSelect({ label, name, control, options, loading }: MultiRelationSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value: string[] = field.value || [];
        const selectedOptions = options.filter((o) => value.includes(o.id));

        const toggle = (id: string) => {
          field.onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
        };

        return (
          <div>
            <label className="label">{label}</label>
            {selectedOptions.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.id}
                    className="badge cursor-pointer bg-brand-100 text-brand-700 hover:bg-brand-200"
                    onClick={() => toggle(opt.id)}
                    title="Remove"
                  >
                    {opt.label} ×
                  </span>
                ))}
              </div>
            )}
            <div className="rounded-md border border-slate-300">
              <input
                className="w-full border-0 border-b border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-0"
                placeholder={loading ? 'Loading…' : `Search ${label.toLowerCase()}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="max-h-36 overflow-y-auto">
                {filtered.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className={`block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
                      value.includes(opt.id) ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    {value.includes(opt.id) ? '✓ ' : ''}
                    {opt.label}
                  </button>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="px-3 py-1.5 text-sm text-slate-400">No matches</div>
                )}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
