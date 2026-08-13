import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { useController } from 'react-hook-form';
import RichTextEditor from './RichTextEditor';

interface LocalizedInputProps {
  label: string;
  name: string; // e.g. "title" or `instructions.${index}`
  register: UseFormRegister<any>;
  // `any` because react-hook-form's per-page Control<SpecificFormValues> (from zodResolver) never
  // structurally widens to a shared prop type — its resolver's `validate` param is checked contravariantly.
  control?: any; // required when richText is set
  errors?: FieldErrors;
  textarea?: boolean;
  richText?: boolean; // HTML WYSIWYG editor instead of a plain textarea; needs `control`
  rows?: number;
  required?: boolean; // malayalam only
}

function ControlledRichText({ control, name, dir, rows }: { control: any; name: string; dir: 'ltr' | 'auto'; rows: number }) {
  const { field } = useController({ control, name });
  return <RichTextEditor value={field.value || ''} onChange={field.onChange} dir={dir} rows={rows} />;
}

// Arabic isn't part of this multi-language group — it only lives in the dedicated
// "Arabic text" field (Dua / Tawaf-dua / Sa'i-dua), not duplicated in every localized box.
const LANGS = [
  { key: 'malayalam', label: 'Malayalam', dir: 'auto' as const },
  { key: 'english', label: 'English', dir: 'ltr' as const },
];

function getIn(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
}

export default function LocalizedInput({
  label,
  name,
  register,
  control,
  errors,
  textarea,
  richText,
  rows = 3,
  required = true,
}: LocalizedInputProps) {
  const fieldErrors = getIn(errors, name) as Record<string, { message?: string }> | undefined;

  return (
    <div>
      <div className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      {/* Short fields (title-like) sit side by side; descriptive fields (textarea/richText) stack one per row for room to write. */}
      <div className={textarea || richText ? 'space-y-3' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        {LANGS.map((lang) => (
          <div key={lang.key}>
            <div className="mb-1 text-xs font-medium text-slate-500">
              {lang.label}
              {lang.key === 'malayalam' && required && <span className="text-red-500"> *</span>}
            </div>
            {richText ? (
              <ControlledRichText control={control!} name={`${name}.${lang.key}`} dir={lang.dir} rows={rows} />
            ) : textarea ? (
              <textarea className="input" rows={rows} dir={lang.dir} {...register(`${name}.${lang.key}`)} />
            ) : (
              <input className="input" dir={lang.dir} {...register(`${name}.${lang.key}`)} />
            )}
          </div>
        ))}
      </div>
      {fieldErrors?.malayalam?.message && <p className="mt-1 text-xs text-red-600">{fieldErrors.malayalam.message}</p>}
    </div>
  );
}
