import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import type { Category } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import TextField from '../../components/fields/TextField';
import NumberField from '../../components/fields/NumberField';
import Toggle from '../../components/fields/Toggle';
import LocalizedInput from '../../components/fields/LocalizedInput';
import { CATEGORY_GROUPS, categoryGroupLabel } from '../../lib/categoryGroups';

const locRequired = z.object({ malayalam: z.string().min(1, 'Malayalam is required'), english: z.string().optional() });

const schema = z.object({
  group: z.enum(['ritual-step', 'dua', 'guide-topic', 'emergency-contact']),
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens and underscores only'),
  label: locRequired,
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  group: 'dua',
  key: '',
  label: { malayalam: '', english: '' },
  order: 0,
  isPublished: true,
};

export default function CategoryFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const groupParam = searchParams.get('group');
  const initialGroup = (CATEGORY_GROUPS.some((g) => g.value === groupParam) ? groupParam : defaults.group) as FormValues['group'];
  const { isNew, item, isLoading, save, saving } = useContentSave<Category>('categories', id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { ...defaults, group: initialGroup } });

  useEffect(() => {
    if (item) {
      reset({
        group: item.group,
        key: item.key,
        label: item.label,
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));
  const group = item?.group ?? initialGroup;
  const backGroup = item?.group ?? (isNew ? initialGroup : undefined);

  return (
    <FormShell
      title={isNew ? `New ${categoryGroupLabel(group)} Category` : `Edit ${categoryGroupLabel(group)} Category`}
      backHref={`/categories${backGroup ? `?group=${backGroup}` : ''}`}
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <input type="hidden" {...register('group')} />

      <div>
        <div className="label">Field</div>
        <div className="badge bg-slate-100 text-slate-600">{categoryGroupLabel(group)}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Key" name="key" register={register} error={errors.key} hint="Stored on each item, e.g. arafah" />
        <NumberField label="Order" name="order" register={register} />
      </div>

      <LocalizedInput label="Label" name="label" register={register} errors={errors} />

      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
