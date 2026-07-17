import type { PrimaryAttributeId } from '@/domain/value-objects/vocabularies';

export interface Hero {
  id: string;
  dotaId: number;
  internalName: string;
  displayName: string;
  primaryAttribute: PrimaryAttributeId;
  assetSlug: string;
  isActive: boolean;
  imageSmallUrl: string | null;
  imageLargeUrl: string | null;
  imageFullUrl: string | null;
}
