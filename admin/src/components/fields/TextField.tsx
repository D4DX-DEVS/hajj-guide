import type { UseFormRegister, FieldError } from 'react-hook-form';

interface TextFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  dir?: 'ltr' | 'rtl';
  hint?: string;
}

export default function TextField({
  label,
  name,
  register,
  error,
  placeholder,
  textarea,
  rows = 3,
  dir,
  hint,
}: TextFieldProps) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea id={name} className="input" rows={rows} dir={dir} placeholder={placeholder} {...register(name)} />
      ) : (
        <input id={name} className="input" dir={dir} placeholder={placeholder} {...register(name)} />
      )}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
