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
  createdAt: string;
  updatedAt: string;
}
