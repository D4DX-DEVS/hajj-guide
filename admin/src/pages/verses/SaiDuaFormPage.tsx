import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useRelationOptions, audioLabel } from '../../lib/useRelationOptions';
import type { SaiDua } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import VerseCommonFields from '../../components/content/VerseCommonFields';
import SelectField from '../../components/fields/SelectField';
import NumberField from '../../components/fields/NumberField';

const locSchema = z.object({ malayalam: z.string().optional(), english: z.string().optional(), arabic: z.string().optional() });

const schema = z.object({
  leg: z.coerce.number().int().min(1).max(7),
  direction: z.enum(['safa-marwa', 'marwa-safa']),
  label: locSchema.optional(),
  arabicText: z.string().min(1, 'Arabic text is required'),
  transliteration: locSchema.optional(),
  meaning: locSchema.optional(),
  audioId: z.string().nullable(),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  leg: 1,
  direction: 'safa-marwa',
  label: { malayalam: '', english: '', arabic: '' },
  arabicText: '',
  transliteration: { malayalam: '', english: '', arabic: '' },
  meaning: { malayalam: '', english: '', arabic: '' },
  audioId: null,
  order: 0,
  isPublished: false,
};

export default function SaiDuaFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<SaiDua>('sai-duas', id);
  const { options: audioOptions, isLoading: audioLoading } = useRelationOptions('/api/admin/audio', audioLabel);

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
        leg: item.leg,
        direction: item.direction,
        label: item.label || { malayalam: '', english: '', arabic: '' },
        arabicText: item.arabicText,
        transliteration: item.transliteration || { malayalam: '', english: '', arabic: '' },
        meaning: item.meaning || { malayalam: '', english: '', arabic: '' },
        audioId: item.audioId,
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));

  return (
    <FormShell
      title={isNew ? "New Sa'i Dua" : "Edit Sa'i Dua"}
      backHref="/sai-duas"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Leg (1-7)" name="leg" register={register} min={1} max={7} />
        <SelectField
          label="Direction"
          name="direction"
          register={register}
          options={[
            { value: 'safa-marwa', label: 'Safa → Marwa' },
            { value: 'marwa-safa', label: 'Marwa → Safa' },
          ]}
        />
      </div>
      <VerseCommonFields register={register} control={control} errors={errors} audioOptions={audioOptions} audioLoading={audioLoading} />
    </FormShell>
  );
}
