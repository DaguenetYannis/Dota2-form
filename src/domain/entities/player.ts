import type { RoleId } from '@/domain/value-objects/vocabularies';

export interface Player {
  id: string;
  teamId: string;
  pseudonym: string;
  normalizedPseudo: string;
  steamId: string | null;
  mainRole: RoleId;
  secondaryRoles: RoleId[];
  createdAt: string;
  updatedAt: string;
}

export function normalizePlayerPseudo(pseudo: string): string {
  return pseudo.trim().toLocaleLowerCase();
}

export function normalizeSteamId(steamId: string): string {
  return steamId.trim();
}
