import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useCategoryOptions } from '../../lib/useRelationOptions';
import type { EmergencyContact } from '../../lib/types';
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

const schema = z.object({
  name: locRequired,
  number: z.string().min(2, 'Required'),
  description: locSchema.optional(),
  country: z.string().trim().length(2, 'Use a 2-letter country code').toUpperCase(),
  category: z.string().min(1, 'Category is required'),
  iconEmoji: z.string().optional(),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  name: { malayalam: '', english: '', arabic: '' },
  number: '',
  description: { malayalam: '', english: '', arabic: '' },
  country: 'SA',
  category: 'other',
  iconEmoji: '',
  order: 0,
  isPublished: false,
};

export default function EmergencyContactFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<EmergencyContact>('emergency-contacts', id);
  const { options: categoryOptions } = useCategoryOptions('emergency-contact');

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
        name: item.name,
        number: item.number,
        description: item.description || { malayalam: '', english: '', arabic: '' },
        country: item.country,
        category: item.category,
        iconEmoji: item.iconEmoji || '',
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit((values) => save(values));

  return (
    <FormShell
      title={isNew ? 'New Emergency Contact' : 'Edit Emergency Contact'}
      backHref="/emergency-contacts"
      onSubmit={onSubmit}
      submitting={saving}
      loading={!isNew && isLoading}
    >
      <LocalizedInput label="Name" name="name" register={register} errors={errors} />
      <LocalizedInput label="Description" name="description" register={register} control={control} errors={errors} richText required={false} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TextField label="Number" name="number" register={register} error={errors.number} />
        <TextField label="Country code" name="country" register={register} error={errors.country} placeholder="SA" />
        <SelectField label="Category" name="category" register={register} options={categoryOptions} />
        <TextField label="Icon emoji" name="iconEmoji" register={register} placeholder="🚨" />
      </div>

      <NumberField label="Order" name="order" register={register} />
      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
