import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useRelationOptions, useCategoryOptions, duaLabel } from '../../lib/useRelationOptions';
import type { RitualStep } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import TextField from '../../components/fields/TextField';
import NumberField from '../../components/fields/NumberField';
import SelectField from '../../components/fields/SelectField';
import Toggle from '../../components/fields/Toggle';
import LocalizedInput from '../../components/fields/LocalizedInput';
import MultiRelationSelect from '../../components/fields/MultiRelationSelect';

const locSchema = z.object({ malayalam: z.string().optional(), english: z.string().optional(), arabic: z.string().optional() });
const locRequired = z.object({
  malayalam: z.string().min(1, 'Malayalam is required'),
  english: z.string().optional(),
  arabic: z.string().optional(),
});

const schema = z.object({
  ritualType: z.enum(['hajj', 'umrah']),
  stepNumber: z.coerce.number().int().min(1),
  category: z.string().optional(),
  order: z.coerce.number().int().default(0),
  title: locRequired,
  description: locSchema.optional(),
  instructions: z.array(locRequired),
  iconEmoji: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  duaIds: z.array(z.string()),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  ritualType: 'umrah',
  stepNumber: 1,
  category: '',
  order: 0,
  title: { malayalam: '', english: '', arabic: '' },
  description: { malayalam: '', english: '', arabic: '' },
  instructions: [],
  iconEmoji: '',
  imageUrl: '',
  videoUrl: '',
  duaIds: [],
  isPublished: false,
};

export default function RitualStepFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<RitualStep>('ritual-steps', id);
  const { options: duaOptions, isLoading: duasLoading } = useRelationOptions('/api/admin/duas', duaLabel);
  const { options: categoryOptions } = useCategoryOptions('ritual-step');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const { fields, append, remove } = useFieldArray({ control, name: 'instructions' });

  useEffect(() => {
    if (item) {
      reset({
        ritualType: item.ritualType,
        stepNumber: item.stepNumber,
        category: item.category || '',
        order: item.order,
        title: item.title,
        description: item.description || { malayalam: '', english: '', arabic: '' },
        instructions: item.instructions?.length ? item.instructions : [],
        iconEmoji: item.iconEmoji || '',
        imageUrl: item.imageUrl || '',
        videoUrl: item.videoUrl || '',
        duaIds: item.duaIds || [],
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));

  return (
    <FormShell
      title={isNew ? 'New Ritual Step' : 'Edit Ritual Step'}
      backHref="/ritual-steps"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <SelectField
          label="Ritual"
          name="ritualType"
          register={register}
          options={[
            { value: 'umrah', label: 'Umrah' },
            { value: 'hajj', label: 'Hajj' },
          ]}
        />
        <NumberField label="Step number" name="stepNumber" register={register} error={errors.stepNumber} min={1} />
        <SelectField
          label="Category"
          name="category"
          register={register}
          options={[{ value: '', label: '— none —' }, ...categoryOptions]}
        />
        <NumberField label="Order" name="order" register={register} />
        <TextField label="Icon emoji" name="iconEmoji" register={register} placeholder="🕋" />
      </div>

      <LocalizedInput label="Title" name="title" register={register} errors={errors} />
      <LocalizedInput label="Description" name="description" register={register} control={control} errors={errors} richText required={false} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0">Instructions</label>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => append({ malayalam: '', english: '', arabic: '' })}
          >
            + Add instruction
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <div className="flex-1">
                <LocalizedInput label={`Step ${index + 1}`} name={`instructions.${index}`} register={register} errors={errors} />
              </div>
              <button type="button" className="btn-ghost mt-5 text-red-600" onClick={() => remove(index)}>
                Remove
              </button>
            </div>
          ))}
          {fields.length === 0 && <p className="text-sm text-slate-400">No instructions yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Image URL" name="imageUrl" register={register} />
        <TextField label="YouTube video ID" name="videoUrl" register={register} hint="Just the ID, not the full URL" />
      </div>

      <div className="flex flex-wrap gap-6">
        <Toggle label="Published" name="isPublished" control={control} />
      </div>

      <MultiRelationSelect label="Linked duas" name="duaIds" control={control} options={duaOptions} loading={duasLoading} />
    </FormShell>
  );
}
