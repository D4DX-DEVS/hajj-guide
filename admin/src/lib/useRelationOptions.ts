import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface RelationOption {
  id: string;
  label: string;
}

/**
 * Small content sets (ritual steps, duas, audio — tens to a few hundred rows),
 * so one page fetched up front and filtered client-side is simpler than a
 * debounced server search and feels instant either way.
 */
export function useRelationOptions(path: string, labelFn: (item: any) => string) {
  const query = useQuery({
    queryKey: ['relation-options', path],
    queryFn: async () => {
      const { data } = await api.get<any[]>(path, { limit: 500, includeDeleted: false });
      return data.map((item) => ({ id: item.id, label: labelFn(item) }));
    },
    staleTime: 60_000,
  });

  return { options: query.data ?? [], isLoading: query.isLoading };
}

export const duaLabel = (d: any) => d.title?.english || d.title?.malayalam || d.arabicText?.slice(0, 30) || d.id;
export const ritualStepLabel = (s: any) =>
  `${s.ritualType} #${s.stepNumber} — ${s.title?.english || s.title?.malayalam || ''}`;
export const audioLabel = (a: any) => a.title?.english || a.title?.malayalam || a.id;

/** Dropdown options for a category field (`categories` collection filtered by group), managed on the Category screen. */
export function useCategoryOptions(group: 'dua' | 'emergency-contact' | 'ritual-step' | 'guide-topic') {
  const query = useQuery({
    queryKey: ['category-options', group],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/admin/categories', { group, limit: 500, includeDeleted: false });
      return data.map((c) => ({ value: c.key as string, label: (c.label?.english || c.label?.malayalam || c.key) as string }));
    },
    staleTime: 60_000,
  });

  return { options: query.data ?? [], isLoading: query.isLoading };
}
