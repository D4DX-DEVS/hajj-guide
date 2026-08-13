import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast, errorMessage } from '../../lib/toast';
import type { AppSettings } from '../../lib/types';
import Spinner from '../../components/Spinner';
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
  highlightedRitual: z.enum(['hajj', 'umrah']),
  announcementIsActive: z.boolean(),
  announcement: locSchema.optional(),
  banners: z.array(
    z.object({
      key: z.string().trim().min(1, 'Required'),
      title: locRequired,
      subtitle: locSchema.optional(),
      imageUrl: z.string().optional(),
      actionRoute: z.string().optional(),
      order: z.coerce.number().int().default(0),
      isActive: z.boolean(),
    }),
  ),
  quickActions: z.array(
    z.object({
      key: z.string().trim().min(1, 'Required'),
      label: locRequired,
      iconEmoji: z.string().optional(),
      route: z.string().optional(),
      order: z.coerce.number().int().default(0),
      isActive: z.boolean(),
    }),
  ),
  featureFlags: z.array(z.object({ key: z.string().trim().min(1, 'Required'), value: z.boolean() })),
  supportEmail: z.string().optional(),
  supportPhone: z.string().optional(),
  privacyPolicyUrl: z.string().optional(),
  termsUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  highlightedRitual: 'umrah',
  announcementIsActive: false,
  announcement: { malayalam: '', english: '', arabic: '' },
  banners: [],
  quickActions: [],
  featureFlags: [],
  supportEmail: '',
  supportPhone: '',
  privacyPolicyUrl: '',
  termsUrl: '',
};

export default function AppSettingsPage() {
  const { push } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => (await api.get<AppSettings>('/api/admin/settings')).data,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const banners = useFieldArray({ control, name: 'banners' });
  const quickActions = useFieldArray({ control, name: 'quickActions' });
  const flags = useFieldArray({ control, name: 'featureFlags' });

  useEffect(() => {
    if (query.data) {
      reset({
        highlightedRitual: query.data.highlightedRitual,
        announcementIsActive: query.data.announcementIsActive,
        announcement: query.data.announcement || { malayalam: '', english: '', arabic: '' },
        banners: query.data.banners,
        quickActions: query.data.quickActions,
        featureFlags: Object.entries(query.data.featureFlags || {}).map(([key, value]) => ({ key, value })),
        supportEmail: query.data.supportEmail || '',
        supportPhone: query.data.supportPhone || '',
        privacyPolicyUrl: query.data.privacyPolicyUrl || '',
        termsUrl: query.data.termsUrl || '',
      });
    }
  }, [query.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const { featureFlags, ...rest } = values;
      const featureFlagsObj = Object.fromEntries(featureFlags.map((f) => [f.key, f.value]));
      return api.put('/api/admin/settings', { ...rest, featureFlags: featureFlagsObj });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      push('Settings saved');
    },
    onError: (err) => push(errorMessage(err), 'error'),
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const onSubmit = handleSubmit((values) => saveMutation.mutate(values));

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-slate-900">App Settings</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <section className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold text-slate-900">General</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Highlighted ritual"
              name="highlightedRitual"
              register={register}
              options={[
                { value: 'umrah', label: 'Umrah' },
                { value: 'hajj', label: 'Hajj' },
              ]}
            />
            <TextField label="Support email" name="supportEmail" register={register} />
            <TextField label="Support phone" name="supportPhone" register={register} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Privacy policy URL" name="privacyPolicyUrl" register={register} />
            <TextField label="Terms URL" name="termsUrl" register={register} />
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Announcement</h2>
            <Toggle label="Active" name="announcementIsActive" control={control} />
          </div>
          <LocalizedInput label="Message" name="announcement" register={register} errors={errors} textarea required={false} />
        </section>

        <section className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Home banners</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                banners.append({
                  key: '',
                  title: { malayalam: '', english: '', arabic: '' },
                  order: banners.fields.length,
                  isActive: true,
                })
              }
            >
              + Add banner
            </button>
          </div>
          {banners.fields.map((field, index) => (
            <div key={field.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Banner {index + 1}</span>
                <div className="flex items-center gap-3">
                  <Toggle label="Active" name={`banners.${index}.isActive`} control={control} />
                  <button type="button" className="btn-ghost text-red-600" onClick={() => banners.remove(index)}>
                    Remove
                  </button>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TextField label="Key" name={`banners.${index}.key`} register={register} />
                <TextField label="Image URL" name={`banners.${index}.imageUrl`} register={register} />
                <TextField label="Action route" name={`banners.${index}.actionRoute`} register={register} />
                <NumberField label="Order" name={`banners.${index}.order`} register={register} />
              </div>
              <LocalizedInput label="Title" name={`banners.${index}.title`} register={register} errors={errors} />
            </div>
          ))}
          {banners.fields.length === 0 && <p className="text-sm text-slate-400">No banners.</p>}
        </section>

        <section className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                quickActions.append({
                  key: '',
                  label: { malayalam: '', english: '', arabic: '' },
                  order: quickActions.fields.length,
                  isActive: true,
                })
              }
            >
              + Add action
            </button>
          </div>
          {quickActions.fields.map((field, index) => (
            <div key={field.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Action {index + 1}</span>
                <div className="flex items-center gap-3">
                  <Toggle label="Active" name={`quickActions.${index}.isActive`} control={control} />
                  <button type="button" className="btn-ghost text-red-600" onClick={() => quickActions.remove(index)}>
                    Remove
                  </button>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TextField label="Key" name={`quickActions.${index}.key`} register={register} />
                <TextField label="Icon emoji" name={`quickActions.${index}.iconEmoji`} register={register} />
                <TextField label="Route" name={`quickActions.${index}.route`} register={register} />
                <NumberField label="Order" name={`quickActions.${index}.order`} register={register} />
              </div>
              <LocalizedInput label="Label" name={`quickActions.${index}.label`} register={register} errors={errors} />
            </div>
          ))}
          {quickActions.fields.length === 0 && <p className="text-sm text-slate-400">No quick actions.</p>}
        </section>

        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Feature flags</h2>
            <button type="button" className="btn-secondary" onClick={() => flags.append({ key: '', value: false })}>
              + Add flag
            </button>
          </div>
          {flags.fields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap items-center gap-3">
              <input className="input min-w-0 flex-1" placeholder="flagName" {...register(`featureFlags.${index}.key`)} />
              <Toggle label="On" name={`featureFlags.${index}.value`} control={control} />
              <button type="button" className="btn-ghost text-red-600" onClick={() => flags.remove(index)}>
                Remove
              </button>
            </div>
          ))}
          {flags.fields.length === 0 && <p className="text-sm text-slate-400">No feature flags.</p>}
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
