import type { RoleId } from '@/domain/value-objects/vocabularies';

export interface Player {
  id: string;
  teamId: string;
  pseudonym: string;
  mainRole: RoleId;
  secondaryRoles: RoleId[];
  createdAt: string;
  updatedAt: string;
}
