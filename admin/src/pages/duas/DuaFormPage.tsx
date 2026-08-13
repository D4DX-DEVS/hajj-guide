import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useRelationOptions, useCategoryOptions, ritualStepLabel, audioLabel } from '../../lib/useRelationOptions';
import type { Dua } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import TextField from '../../components/fields/TextField';
import NumberField from '../../components/fields/NumberField';
import SelectField from '../../components/fields/SelectField';
import Toggle from '../../components/fields/Toggle';
import LocalizedInput from '../../components/fields/LocalizedInput';
import RelationSelect from '../../components/fields/RelationSelect';

const locSchema = z.object({ malayalam: z.string().optional(), english: z.string().optional(), arabic: z.string().optional() });
const locRequired = z.object({
  malayalam: z.string().min(1, 'Malayalam is required'),
  english: z.string().optional(),
  arabic: z.string().optional(),
});

const schema = z.object({
  title: locRequired,
  arabicText: z.string().min(1, 'Arabic text is required'),
  transliteration: locSchema.optional(),
  meaning: locSchema.optional(),
  category: z.string().min(1, 'Category is required'),
  ritualType: z.enum(['hajj', 'umrah', 'both']),
  ritualStepId: z.string().nullable(),
  audioId: z.string().nullable(),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  title: { malayalam: '', english: '', arabic: '' },
  arabicText: '',
  transliteration: { malayalam: '', english: '', arabic: '' },
  meaning: { malayalam: '', english: '', arabic: '' },
  category: 'general',
  ritualType: 'both',
  ritualStepId: null,
  audioId: null,
  order: 0,
  isPublished: false,
};

export default function DuaFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<Dua>('duas', id);
  const { options: stepOptions, isLoading: stepsLoading } = useRelationOptions('/api/admin/ritual-steps', ritualStepLabel);
  const { options: audioOptions, isLoading: audioLoading } = useRelationOptions('/api/admin/audio', audioLabel);
  const { options: categoryOptions } = useCategoryOptions('dua');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        arabicText: item.arabicText,
        transliteration: item.transliteration || { malayalam: '', english: '', arabic: '' },
        meaning: item.meaning || { malayalam: '', english: '', arabic: '' },
        category: item.category,
        ritualType: item.ritualType,
        ritualStepId: item.ritualStepId,
        audioId: item.audioId,
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));

  return (
    <FormShell
      title={isNew ? 'New Dua' : 'Edit Dua'}
      backHref="/duas"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <LocalizedInput label="Title" name="title" register={register} errors={errors} />
      <TextField label="Arabic text" name="arabicText" register={register} error={errors.arabicText} dir="rtl" textarea />
      <LocalizedInput label="Transliteration" name="transliteration" register={register} errors={errors} required={false} />
      <LocalizedInput label="Meaning" name="meaning" register={register} errors={errors} textarea required={false} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SelectField label="Category" name="category" register={register} options={categoryOptions} />
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
        <NumberField label="Order" name="order" register={register} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RelationSelect label="Linked ritual step" name="ritualStepId" control={control} options={stepOptions} loading={stepsLoading} />
        <RelationSelect label="Audio" name="audioId" control={control} options={audioOptions} loading={audioLoading} />
      </div>

      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
