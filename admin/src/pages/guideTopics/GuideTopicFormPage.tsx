import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContentSave } from '../../lib/useContentSave';
import { useCategoryOptions } from '../../lib/useRelationOptions';
import { api } from '../../lib/api';
import { useToast, errorMessage } from '../../lib/toast';
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
  coverImageSource: z.enum(['url', 'upload']).default('url'),
  coverImage: z.string().optional(),
  coverImageStorageKey: z.string().optional(),
  videoSource: z.enum(['youtube', 'upload']).default('youtube'),
  videoUrl: z.string().optional(),
  videoFileUrl: z.string().optional(),
  videoStorageKey: z.string().optional(),
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
  coverImageSource: 'url',
  coverImage: '',
  coverImageStorageKey: '',
  videoSource: 'youtube',
  videoUrl: '',
  videoFileUrl: '',
  videoStorageKey: '',
  order: 0,
  isPublished: false,
};

export default function GuideTopicFormPage() {
  const { id } = useParams();
  const { isNew, item, isLoading, save, saving } = useContentSave<GuideTopic>('guide-topics', id);
  const { options: categoryOptions } = useCategoryOptions('guide-topic');
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

  const { fields, append, remove } = useFieldArray({ control, name: 'sessions' });
  const sessions = watch('sessions');
  const coverImageSource = watch('coverImageSource');
  const videoSource = watch('videoSource');

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
        coverImageSource: item.coverImageSource || 'url',
        coverImage: item.coverImage || '',
        coverImageStorageKey: item.coverImageStorageKey || '',
        videoSource: item.videoSource || 'youtube',
        videoUrl: item.videoUrl || '',
        videoFileUrl: item.videoFileUrl || '',
        videoStorageKey: item.videoStorageKey || '',
        order: item.order,
        isPublished: item.isPublished,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    let imageFields: { coverImage?: string; coverImageStorageKey?: string } = {};

    if (values.coverImageSource === 'upload' && imageFile) {
      setUploadingImage(true);
      try {
        const form = new FormData();
        form.append('file', imageFile);
        form.append('folder', 'images');
        const { data } = await api.upload<{ url: string; key: string; size: number }>('/api/admin/upload', form);
        imageFields = { coverImage: data.url, coverImageStorageKey: data.key };
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
      title={isNew ? 'New Guide Topic' : 'Edit Guide Topic'}
      backHref="/guide-topics"
      onSubmit={onSubmit}
      submitting={saving || uploadingImage || uploadingVideo}
      loading={!isNew && isLoading}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      <LocalizedInput label="Main title" name="mainTitle" register={register} errors={errors} />

      <div>
        <label className="label mb-1.5">Sessions</label>
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
          <button type="button" className="btn-secondary" onClick={() => append(emptySession)}>
            + Add session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <SelectField
            label="Cover image source"
            name="coverImageSource"
            register={register}
            options={[
              { value: 'url', label: 'URL' },
              { value: 'upload', label: 'Upload file' },
            ]}
          />

          {coverImageSource === 'url' ? (
            <div className="mt-2">
              <TextField label="Cover image URL" name="coverImage" register={register} />
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
              {item?.coverImage && !imageFile && (
                <img src={item.coverImage} className="mt-2 max-h-40 rounded border border-slate-200" alt="" />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Order" name="order" register={register} />
      </div>

      <Toggle label="Published" name="isPublished" control={control} />
    </FormShell>
  );
}
