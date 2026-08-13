interface SegmentedProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

/** Controlled segmented button group — filter-bar alternative to a native <select>. */
export default function Segmented({ value, onChange, options }: SegmentedProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm transition-all duration-150 ${
            value === opt.value
              ? 'border-brand-600 bg-brand-600 font-medium text-white shadow-sm'
              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
