import type { UseFormRegister, FieldError } from 'react-hook-form';

interface SelectFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  options: { value: string; label: string }[];
  error?: FieldError;
}

export default function SelectField({ label, name, register, options, error }: SelectFieldProps) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select id={name} className="input" {...register(name)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
