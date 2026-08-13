import { Controller } from 'react-hook-form';

interface ToggleProps {
  label: string;
  name: string;
  // Deliberately loose: this wraps arbitrary per-page form shapes, and
  // `Control<any>` itself fails to structurally accept a concrete `Control<T>`
  // due to variance in RHF's nested validate-callback types.
  control: any;
}

export default function Toggle({ label, name, control }: ToggleProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className="flex cursor-pointer items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(field.value)}
            onClick={() => field.onChange(!field.value)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              field.value ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                field.value ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      )}
    />
  );
}
