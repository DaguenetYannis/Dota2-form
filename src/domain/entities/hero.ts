import type { PrimaryAttributeId } from '@/domain/value-objects/vocabularies';

export interface Hero {
  id: string;
  dotaId: number;
  internalName: string;
  displayName: string;
  primaryAttribute: PrimaryAttributeId;
  imageUrl?: string;
}
