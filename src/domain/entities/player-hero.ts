import type {
  DraftPhaseId,
  IndividualPlaystyleId,
  PoolTierId,
  RoleId,
} from '@/domain/value-objects/vocabularies';

export interface PlayerHero {
  id: string;
  playerId: string;
  heroId: string;
  order: number;
  roles: RoleId[];
  poolTier: PoolTierId;
  comfort: number;
  confidence: number;
  recentExperience: number;
  blindPickConfidence: number;
  flexPick: boolean;
  preferredDraftPhase: DraftPhaseId;
  preferredPlaystyles: IndividualPlaystyleId[];
  requiredAlliedFeatures: string[];
  personalNotes: string;
  fightEntryStartMinute: number | null;
  fightEntryEndMinute: number | null;
  createdAt: string;
  updatedAt: string;
}

export function isCorePlayerHero(
  playerHero: Pick<PlayerHero, 'roles'>,
): boolean {
  return playerHero.roles.some((role) =>
    ['position_1', 'position_2', 'position_3'].includes(role),
  );
}
