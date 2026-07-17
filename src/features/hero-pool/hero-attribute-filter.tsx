import type { PrimaryAttributeId } from '@/domain/value-objects/vocabularies';

export const attributeOptions: {
  value: PrimaryAttributeId | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'Tous' },
  { value: 'strength', label: 'Force' },
  { value: 'agility', label: 'Agilité' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'universal', label: 'Universel' },
];
