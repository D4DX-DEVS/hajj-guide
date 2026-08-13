import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useRelationOptions, audioLabel } from '../../lib/useRelationOptions';
import type { TawafDua } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import VerseCommonFields from '../../components/content/VerseCommonFields';
import SelectField from '../../components/fields/SelectField';

const locSchema = z.object({ malayalam: z.string().optional(), english: z.string().optional(), arabic: z.string().optional() });

const schema = z.object({
  roundNumber: z.enum(['start', '1', '2', '3', '4', '5', '6', '7', 'end']),
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
  roundNumber: '1',
  label: { malayalam: '', english: '', arabic: '' },
  arabicText: '',
  transliteration: { malayalam: '', english: '', arabic: '' },
  meaning: { malayalam: '', english: '', arabic: '' },
  audioId: null,
  order: 0,
  isPublished: false,
};

const ROUND_OPTIONS = ['start', '1', '2', '3', '4', '5', '6', '7', 'end'].map((v) => ({
  value: v,
  label: v === 'start' ? 'Start (before round 1)' : v === 'end' ? 'End (after round 7)' : `Round ${v}`,
}));

export default function TawafDuaFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<TawafDua>('tawaf-duas', id);
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
        roundNumber: item.roundNumber as FormValues['roundNumber'],
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
      title={isNew ? 'New Tawaf Dua' : 'Edit Tawaf Dua'}
      backHref="/tawaf-duas"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <SelectField label="Round" name="roundNumber" register={register} options={ROUND_OPTIONS} />
      <VerseCommonFields register={register} control={control} errors={errors} audioOptions={audioOptions} audioLoading={audioLoading} />
    </FormShell>
  );
}
