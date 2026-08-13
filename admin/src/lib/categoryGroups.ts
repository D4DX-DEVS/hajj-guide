export type CategoryGroup = 'ritual-step' | 'dua' | 'guide-topic' | 'emergency-contact';

export interface CategoryGroupOption {
  value: CategoryGroup;
  label: string;
}

/** Content fields that have manageable category values. Add here when a new content type gets one — Layout nav, Categories list and form all read from this single list. */
export const CATEGORY_GROUPS: CategoryGroupOption[] = [
  { value: 'ritual-step', label: 'Ritual Step' },
  { value: 'dua', label: 'Dua' },
  { value: 'guide-topic', label: 'Guide Topic' },
  { value: 'emergency-contact', label: 'Emergency Contact' },
];

export const categoryGroupLabel = (value: string) => CATEGORY_GROUPS.find((g) => g.value === value)?.label || value;
