import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import type { RelationOption } from '../../lib/useRelationOptions';

interface RelationSelectProps {
  label: string;
  name: string;
  // See Toggle.tsx — Control<any> doesn't structurally accept concrete Control<T>.
  control: any;
  options: RelationOption[];
  loading?: boolean;
  allowNone?: boolean;
}

/** Single-value picker. A plain searchable list rather than a positioned dropdown — simpler, no overlap bugs. */
export default function RelationSelect({ label, name, control, options, loading, allowNone = true }: RelationSelectProps) {
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
        const selected = options.find((o) => o.id === field.value);
        return (
          <div>
            <label className="label">{label}</label>
            <div className="rounded-md border border-slate-300">
              <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-1.5">
                <input
                  className="min-w-0 flex-1 border-0 text-sm focus:outline-none focus:ring-0"
                  placeholder={loading ? 'Loading…' : `Search ${label.toLowerCase()}…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {field.value && (
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => field.onChange(null)}
                  >
                    clear
                  </button>
                )}
              </div>
              {selected && (
                <div className="border-b border-slate-100 bg-brand-50 px-3 py-1 text-xs text-brand-700">
                  Selected: {selected.label}
                </div>
              )}
              <div className="max-h-36 overflow-y-auto">
                {allowNone && (
                  <button
                    type="button"
                    onClick={() => field.onChange(null)}
                    className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
                      !field.value ? 'text-brand-700' : 'text-slate-500'
                    }`}
                  >
                    None
                  </button>
                )}
                {filtered.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => field.onChange(opt.id)}
                    className={`block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
                      field.value === opt.id ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                    }`}
                  >
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
