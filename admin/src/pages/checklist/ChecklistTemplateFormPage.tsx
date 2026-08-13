import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import type { ChecklistTemplate } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import TextField from '../../components/fields/TextField';
import NumberField from '../../components/fields/NumberField';
import Toggle from '../../components/fields/Toggle';
import LocalizedInput from '../../components/fields/LocalizedInput';

const locSchema = z.object({ malayalam: z.string().optional(), english: z.string().optional(), arabic: z.string().optional() });
const locRequired = z.object({
  malayalam: z.string().min(1, 'Malayalam is required'),
  english: z.string().optional(),
  arabic: z.string().optional(),
});

const itemSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens and underscores only'),
  title: locRequired,
  note: locSchema.optional(),
  iconEmoji: z.string().optional(),
  order: z.coerce.number().int().default(0),
});

const schema = z.object({
  categoryKey: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens and underscores only'),
  name: locRequired,
  iconEmoji: z.string().optional(),
  order: z.coerce.number().int().default(0),
  items: z.array(itemSchema),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  categoryKey: '',
  name: { malayalam: '', english: '', arabic: '' },
  iconEmoji: '',
  order: 0,
  items: [],
  isPublished: false,
};

export default function ChecklistTemplateFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<ChecklistTemplate>('checklist-template', id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (item) {
      reset({
        categoryKey: item.categoryKey,
        name: item.name,
        iconEmoji: item.iconEmoji || '',
        order: item.order,
        items: item.items,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));

  return (
    <FormShell
      title={isNew ? 'New Checklist Category' : 'Edit Checklist Category'}
      backHref="/checklist-template"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <TextField
            label="Category key"
            name="categoryKey"
            register={register}
            error={errors.categoryKey}
            hint={!isNew ? 'Changing this does not move pilgrims’ saved progress' : undefined}
          />
        </div>
        <NumberField label="Order" name="order" register={register} />
        <TextField label="Icon emoji" name="iconEmoji" register={register} placeholder="📄" />
      </div>

      <LocalizedInput label="Category name" name="name" register={register} errors={errors} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0">Items</label>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => append({ key: '', title: { malayalam: '', english: '', arabic: '' }, iconEmoji: '', order: fields.length })}
          >
            + Add item
          </button>
        </div>
        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Item <span className="font-mono">key</span> is what a pilgrim's tick state references — renaming an existing
          key unticks it for everyone who already checked it off. Safe to add new keys or edit titles freely.
        </div>
        <div className="mt-3 space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Item {index + 1}</span>
                <button type="button" className="btn-ghost text-red-600" onClick={() => remove(index)}>
                  Remove
                </button>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <TextField label="Key" name={`items.${index}.key`} register={register} error={errors.items?.[index]?.key as any} />
                </div>
                <TextField label="Icon emoji" name={`items.${index}.iconEmoji`} register={register} />
                <NumberField label="Order" name={`items.${index}.order`} register={register} />
              </div>
              <LocalizedInput label="Title" name={`items.${index}.title`} register={register} errors={errors} />
            </div>
          ))}
          {fields.length === 0 && <p className="mt-3 text-sm text-slate-400">No items yet.</p>}
        </div>
      </div>

      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
