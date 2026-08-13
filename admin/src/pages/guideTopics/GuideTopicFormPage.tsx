import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useCategoryOptions } from '../../lib/useRelationOptions';
import type { GuideTopic } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import TextField from '../../components/fields/TextField';
import NumberField from '../../components/fields/NumberField';
import SelectField from '../../components/fields/SelectField';
import Toggle from '../../components/fields/Toggle';
import LocalizedInput from '../../components/fields/LocalizedInput';

const locSchema = z.object({ malayalam: z.string().optional(), english: z.string().optional(), arabic: z.string().optional() });
const locRequired = z.object({
  malayalam: z.string().min(1, 'Malayalam is required'),
  english: z.string().optional(),
  arabic: z.string().optional(),
});

const sessionSchema = z.object({
  sessionTitle: locSchema.optional(),
  description: locRequired,
});

const schema = z.object({
  ritualType: z.enum(['hajj', 'umrah', 'both']),
  category: z.string().optional(),
  mainTitle: locRequired,
  sessions: z.array(sessionSchema),
  coverImage: z.string().optional(),
  iconEmoji: z.string().optional(),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const emptySession = { sessionTitle: { malayalam: '', english: '', arabic: '' }, description: { malayalam: '', english: '', arabic: '' } };

const defaults: FormValues = {
  ritualType: 'both',
  category: '',
  mainTitle: { malayalam: '', english: '', arabic: '' },
  sessions: [],
  coverImage: '',
  iconEmoji: '',
  order: 0,
  isPublished: false,
};

export default function GuideTopicFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<GuideTopic>('guide-topics', id);
  const { options: categoryOptions } = useCategoryOptions('guide-topic');

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const { fields, append, remove } = useFieldArray({ control, name: 'sessions' });
  const sessions = watch('sessions');

  useEffect(() => {
    if (item) {
      reset({
        ritualType: item.ritualType,
        category: item.category || '',
        mainTitle: item.mainTitle,
        sessions: item.sessions?.length
          ? item.sessions.map((s) => ({
              sessionTitle: s.sessionTitle || { malayalam: '', english: '', arabic: '' },
              description: s.description,
            }))
          : [],
        coverImage: item.coverImage || '',
        iconEmoji: item.iconEmoji || '',
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));

  return (
    <FormShell
      title={isNew ? 'New Guide Topic' : 'Edit Guide Topic'}
      backHref="/guide-topics"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Ritual"
          name="ritualType"
          register={register}
          options={[
            { value: 'both', label: 'Both' },
            { value: 'hajj', label: 'Hajj' },
            { value: 'umrah', label: 'Umrah' },
          ]}
        />
        <SelectField
          label="Category"
          name="category"
          register={register}
          options={[{ value: '', label: '— none —' }, ...categoryOptions]}
        />
        <TextField label="Icon emoji" name="iconEmoji" register={register} placeholder="📖" />
      </div>

      <LocalizedInput label="Main title" name="mainTitle" register={register} errors={errors} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0">Sessions</label>
          <button type="button" className="btn-secondary" onClick={() => append(emptySession)}>
            + Add session
          </button>
        </div>
        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Session title is optional — a session can be just a description.
        </div>
        <div className="mt-3 space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Session {index + 1}</span>
                <button type="button" className="btn-ghost text-red-600" onClick={() => remove(index)}>
                  Remove
                </button>
              </div>
              <LocalizedInput label="Session title (optional)" name={`sessions.${index}.sessionTitle`} register={register} errors={errors} required={false} />
              <div className="mt-3">
                <LocalizedInput
                  label="Description"
                  name={`sessions.${index}.description`}
                  register={register}
                  control={control}
                  errors={errors}
                  richText
                  rows={5}
                />
              </div>
              <div className="mt-3 rounded-md border border-dashed border-slate-200 p-2">
                <div className="mb-1 text-xs font-medium text-slate-400">Preview (Malayalam)</div>
                <div className="text-sm text-slate-800">
                  {sessions?.[index]?.sessionTitle?.malayalam && <p className="font-bold">{sessions[index].sessionTitle?.malayalam}</p>}
                  <div className="rte-content" dangerouslySetInnerHTML={{ __html: sessions?.[index]?.description?.malayalam || '' }} />
                </div>
              </div>
            </div>
          ))}
          {fields.length === 0 && <p className="mt-3 text-sm text-slate-400">No sessions yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Cover image URL" name="coverImage" register={register} />
        <NumberField label="Order" name="order" register={register} />
      </div>

      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
