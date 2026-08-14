import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast, errorMessage } from '../../lib/toast';
import type { ForceUpdate, Platform } from '../../lib/types';
import Spinner from '../../components/Spinner';
import TextField from '../../components/fields/TextField';
import Toggle from '../../components/fields/Toggle';
import LocalizedInput from '../../components/fields/LocalizedInput';

const locSchema = z.object({ malayalam: z.string().optional(), english: z.string().optional(), arabic: z.string().optional() });

const schema = z.object({
  minVersion: z.string().regex(/^\d+\.\d+\.\d+(\+\d+)?$/, 'e.g. 1.2.3 or 1.2.3+45'),
  latestVersion: z.string().regex(/^\d+\.\d+\.\d+(\+\d+)?$/, 'e.g. 1.2.3 or 1.2.3+45'),
  storeUrl: z.string().url('Must be a full URL'),
  message: locSchema.optional(),
  isMandatory: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  minVersion: '1.0.0',
  latestVersion: '1.0.0',
  storeUrl: '',
  message: { malayalam: '', english: '', arabic: '' },
  isMandatory: false,
};

function PlatformForm({ platform, existing }: { platform: Platform; existing?: ForceUpdate }) {
  const { push } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (existing) {
      reset({
        minVersion: existing.minVersion,
        latestVersion: existing.latestVersion,
        storeUrl: existing.storeUrl,
        message: existing.message || { malayalam: '', english: '', arabic: '' },
        isMandatory: existing.isMandatory,
      });
    }
  }, [existing, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => api.put(`/api/admin/force-update/${platform}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['force-update'] });
      push(`${platform} force-update saved`);
    },
    onError: (err) => push(errorMessage(err), 'error'),
  });

  const onSubmit = handleSubmit((values) => saveMutation.mutate(values));

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h2 className="text-sm font-semibold text-slate-900">
        {platform === 'android' ? 'Android' : 'iOS'}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Minimum version" name="minVersion" register={register} error={errors.minVersion} />
        <TextField label="Latest version" name="latestVersion" register={register} error={errors.latestVersion} />
      </div>
      <TextField label="Store URL" name="storeUrl" register={register} error={errors.storeUrl} />
      <LocalizedInput label="Message" name="message" register={register} errors={errors} textarea required={false} />
      <Toggle label="Mandatory update" name="isMandatory" control={control} />

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function ForceUpdatePage() {
  const query = useQuery({
    queryKey: ['force-update'],
    queryFn: async () => (await api.get<ForceUpdate[]>('/api/admin/force-update')).data,
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const android = query.data?.find((f) => f.platform === 'android');
  const ios = query.data?.find((f) => f.platform === 'ios');

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-slate-900">Force Update</h1>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PlatformForm platform="android" existing={android} />
        <PlatformForm platform="ios" existing={ios} />
      </div>
    </div>
  );
}
