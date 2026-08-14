import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import type { ChecklistTemplate } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
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
  order: z.coerce.number().int().default(0),
});

const schema = z.object({
  name: locRequired,
  order: z.coerce.number().int().default(0),
  items: z.array(itemSchema),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

/** Item key is never shown/edited in the UI — generated once, kept stable so pilgrims' tick state stays valid. */
const generateItemKey = () => `item-${crypto.randomUUID().slice(0, 8)}`;

const defaults: FormValues = {
  name: { malayalam: '', english: '', arabic: '' },
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
        name: item.name,
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
      <div className="max-w-[160px]">
        <NumberField label="Order" name="order" register={register} />
      </div>

      <LocalizedInput label="Category name" name="name" register={register} errors={errors} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0">Items</label>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              append({ key: generateItemKey(), title: { malayalam: '', english: '', arabic: '' }, order: fields.length })
            }
          >
            + Add item
          </button>
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
              <input type="hidden" {...register(`items.${index}.key`)} />
              <div className="mb-3 max-w-[160px]">
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
