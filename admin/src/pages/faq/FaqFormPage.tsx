import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import type { Faq } from '../../lib/types';
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

const schema = z.object({
  title: locRequired,
  description: locSchema.optional(),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  title: { malayalam: '', english: '', arabic: '' },
  description: { malayalam: '', english: '', arabic: '' },
  order: 0,
  isPublished: false,
};

export default function FaqFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<Faq>('faqs', id);

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
        description: item.description || { malayalam: '', english: '', arabic: '' },
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));

  return (
    <FormShell
      title={isNew ? 'New FAQ' : 'Edit FAQ'}
      backHref="/faqs"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <LocalizedInput label="Title" name="title" register={register} errors={errors} />
      <LocalizedInput label="Description" name="description" register={register} control={control} errors={errors} richText required={false} />

      <NumberField label="Order" name="order" register={register} />
      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
