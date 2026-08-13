import type { UseFormRegister, FieldError } from 'react-hook-form';

interface NumberFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  min?: number;
  max?: number;
}

export default function NumberField({ label, name, register, error, min, max }: NumberFieldProps) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        type="number"
        className="input"
        min={min}
        max={max}
        {...register(name, { valueAsNumber: true })}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
