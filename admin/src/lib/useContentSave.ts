import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useToast, errorMessage } from './toast';

/**
 * Shared create/update flow for the content form pages. `apiKey` doubles as
 * both the `/api/admin/<apiKey>` path and the `/<apiKey>` list route, since
 * the two are kept in lockstep across the app.
 */
export function useContentSave<T extends { id: string }>(apiKey: string, id: string | undefined) {
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const itemQuery = useQuery({
    queryKey: ['content-item', apiKey, id],
    queryFn: async () => (await api.get<T>(`/api/admin/${apiKey}/${id}`)).data,
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: unknown) =>
      isNew ? api.post<T>(`/api/admin/${apiKey}`, payload) : api.patch<T>(`/api/admin/${apiKey}/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', apiKey] });
      push(isNew ? 'Created' : 'Saved');
      navigate(`/${apiKey}`);
    },
    onError: (err) => push(errorMessage(err), 'error'),
  });

  return {
    isNew,
    item: itemQuery.data,
    isLoading: itemQuery.isLoading,
    save: (payload: unknown) => saveMutation.mutate(payload),
    saving: saveMutation.isPending,
  };
}
