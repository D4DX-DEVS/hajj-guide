import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useRelationOptions, useCategoryOptions, duaLabel } from '../../lib/useRelationOptions';
import { api } from '../../lib/api';
import { useToast, errorMessage } from '../../lib/toast';
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
  imageSource: z.enum(['url', 'upload']).default('url'),
  imageUrl: z.string().optional(),
  imageStorageKey: z.string().optional(),
  videoSource: z.enum(['youtube', 'upload']).default('youtube'),
  videoUrl: z.string().optional(),
  videoFileUrl: z.string().optional(),
  videoStorageKey: z.string().optional(),
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
  imageSource: 'url',
  imageUrl: '',
  imageStorageKey: '',
  videoSource: 'youtube',
  videoUrl: '',
  videoFileUrl: '',
  videoStorageKey: '',
  duaIds: [],
  isPublished: false,
};

export default function RitualStepFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<RitualStep>('ritual-steps', id);
  const { options: duaOptions, isLoading: duasLoading } = useRelationOptions('/api/admin/duas', duaLabel);
  const { options: categoryOptions } = useCategoryOptions('ritual-step');
  const { push } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const { fields, append, remove } = useFieldArray({ control, name: 'instructions' });
  const imageSource = watch('imageSource');
  const videoSource = watch('videoSource');

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
        imageSource: item.imageSource || 'url',
        imageUrl: item.imageUrl || '',
        imageStorageKey: item.imageStorageKey || '',
        videoSource: item.videoSource || 'youtube',
        videoUrl: item.videoUrl || '',
        videoFileUrl: item.videoFileUrl || '',
        videoStorageKey: item.videoStorageKey || '',
        duaIds: item.duaIds || [],
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    let imageFields: { imageUrl?: string; imageStorageKey?: string } = {};

    if (values.imageSource === 'upload' && imageFile) {
      setUploadingImage(true);
      try {
        const form = new FormData();
        form.append('file', imageFile);
        form.append('folder', 'images');
        const { data } = await api.upload<{ url: string; key: string; size: number }>('/api/admin/upload', form);
        imageFields = { imageUrl: data.url, imageStorageKey: data.key };
      } catch (err) {
        push(errorMessage(err), 'error');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    let videoFields: { videoFileUrl?: string; videoStorageKey?: string } = {};

    if (values.videoSource === 'upload' && videoFile) {
      setUploadingVideo(true);
      setVideoUploadProgress(0);
      try {
        const form = new FormData();
        form.append('file', videoFile);
        form.append('folder', 'videos');
        const { data } = await api.uploadWithProgress<{ url: string; key: string; size: number }>(
          '/api/admin/upload',
          form,
          setVideoUploadProgress,
        );
        videoFields = { videoFileUrl: data.url, videoStorageKey: data.key };
      } catch (err) {
        push(errorMessage(err), 'error');
        setUploadingVideo(false);
        return;
      }
      setUploadingVideo(false);
    }

    save({ ...values, ...imageFields, ...videoFields });
  });

  return (
    <FormShell
      title={isNew ? 'New Ritual Step' : 'Edit Ritual Step'}
      backHref="/ritual-steps"
      onSubmit={onSubmit}
      submitting={saving || uploadingImage || uploadingVideo}
      loading={!isNew && isLoading}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        <div>
          <SelectField
            label="Image source"
            name="imageSource"
            register={register}
            options={[
              { value: 'url', label: 'URL' },
              { value: 'upload', label: 'Upload file' },
            ]}
          />

          {imageSource === 'url' ? (
            <div className="mt-2">
              <TextField label="Image URL" name="imageUrl" register={register} />
            </div>
          ) : (
            <div className="mt-2">
              <label className="label">Image file</label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {item?.imageUrl && !imageFile && (
                <img src={item.imageUrl} className="mt-2 max-h-40 rounded border border-slate-200" alt="" />
              )}
              {imageFile && <p className="mt-1 text-xs text-slate-500">Selected: {imageFile.name}</p>}
              <p className="mt-1 text-xs text-slate-400">Requires DigitalOcean Spaces to be configured on the API.</p>
            </div>
          )}
        </div>

        <div>
          <SelectField
            label="Video source"
            name="videoSource"
            register={register}
            options={[
              { value: 'youtube', label: 'YouTube' },
              { value: 'upload', label: 'Upload file' },
            ]}
          />

          {videoSource === 'youtube' ? (
            <div className="mt-2">
              <TextField label="YouTube URL" name="videoUrl" register={register} hint="Paste the full video URL" />
            </div>
          ) : (
            <div className="mt-2">
              <label className="label">Video file</label>
              <input
                type="file"
                accept="video/*"
                className="input"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {item?.videoFileUrl && !videoFile && (
                <video controls src={item.videoFileUrl} className="mt-2 w-full max-h-64">
                  Your browser does not support video playback.
                </video>
              )}
              {videoFile && !uploadingVideo && <p className="mt-1 text-xs text-slate-500">Selected: {videoFile.name}</p>}
              {uploadingVideo && (
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Uploading… {videoUploadProgress}%</p>
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Requires DigitalOcean Spaces to be configured on the API.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <Toggle label="Published" name="isPublished" control={control} />
      </div>

      <MultiRelationSelect label="Linked duas" name="duaIds" control={control} options={duaOptions} loading={duasLoading} />
    </FormShell>
  );
}
