import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useRelationOptions, duaLabel } from '../../lib/useRelationOptions';
import { api } from '../../lib/api';
import { useToast, errorMessage } from '../../lib/toast';
import type { Audio } from '../../lib/types';
import FormShell from '../../components/content/FormShell';
import TextField from '../../components/fields/TextField';
import NumberField from '../../components/fields/NumberField';
import SelectField from '../../components/fields/SelectField';
import Toggle from '../../components/fields/Toggle';
import LocalizedInput from '../../components/fields/LocalizedInput';
import RelationSelect from '../../components/fields/RelationSelect';

const locRequired = z.object({
  malayalam: z.string().min(1, 'Malayalam is required'),
  english: z.string().optional(),
  arabic: z.string().optional(),
});

const schema = z.object({
  title: locRequired,
  type: z.enum(['talbiyah', 'dua', 'guide']),
  reciter: z.string().optional(),
  linkedDuaId: z.string().nullable(),
  durationSeconds: z.coerce.number().min(0).default(0),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  title: { malayalam: '', english: '', arabic: '' },
  type: 'dua',
  reciter: '',
  linkedDuaId: null,
  durationSeconds: 0,
  order: 0,
  isPublished: false,
};

export default function AudioFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<Audio>('audio', id);
  const { options: duaOptions, isLoading: duasLoading } = useRelationOptions('/api/admin/duas', duaLabel);
  const { push } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        type: item.type,
        reciter: item.reciter || '',
        linkedDuaId: item.linkedDuaId,
        durationSeconds: item.durationSeconds,
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  function onFileSelected(selected: File | null) {
    setFile(selected);
    if (!selected) return;
    const url = URL.createObjectURL(selected);
    const probe = document.createElement('audio');
    probe.preload = 'metadata';
    probe.src = url;
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) setValue('durationSeconds', Math.round(probe.duration));
      URL.revokeObjectURL(url);
    };
  }

  const onSubmit = handleSubmit(async (values) => {
    if (isNew && !file) {
      push('Choose an audio file first', 'error');
      return;
    }

    let fileFields: { fileUrl?: string; storageKey?: string; sizeBytes?: number } = {};

    if (file) {
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'audio');
        const { data } = await api.upload<{ url: string; key: string; size: number }>('/api/admin/upload', form);
        fileFields = { fileUrl: data.url, storageKey: data.key, sizeBytes: data.size };
      } catch (err) {
        push(errorMessage(err), 'error');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    save({ ...values, ...fileFields });
  });

  return (
    <FormShell
      title={isNew ? 'New Audio' : 'Edit Audio'}
      backHref="/audio"
      onSubmit={onSubmit}
      submitting={saving || uploading}
      loading={!isNew && isLoading}
    >
      <div>
        <label className="label">Audio file {isNew && <span className="text-red-500">*</span>}</label>
        <input
          type="file"
          accept="audio/*"
          className="input"
          onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
        />
        {item?.fileUrl && !file && (
          <audio controls src={item.fileUrl} className="mt-2 w-full">
            Your browser does not support audio playback.
          </audio>
        )}
        {file && <p className="mt-1 text-xs text-slate-500">Selected: {file.name}</p>}
        <p className="mt-1 text-xs text-slate-400">Requires DigitalOcean Spaces to be configured on the API.</p>
      </div>

      <LocalizedInput label="Title" name="title" register={register} errors={errors} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SelectField
          label="Type"
          name="type"
          register={register}
          options={[
            { value: 'talbiyah', label: 'Talbiyah' },
            { value: 'dua', label: 'Dua' },
            { value: 'guide', label: 'Guide' },
          ]}
        />
        <TextField label="Reciter" name="reciter" register={register} />
        <NumberField label="Duration (sec)" name="durationSeconds" register={register} min={0} />
        <NumberField label="Order" name="order" register={register} />
      </div>

      <RelationSelect label="Linked dua" name="linkedDuaId" control={control} options={duaOptions} loading={duasLoading} />

      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
