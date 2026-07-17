export const roleIds = [
  'position_1',
  'position_2',
  'position_3',
  'position_4',
  'position_5',
] as const;

export type RoleId = (typeof roleIds)[number];

export const responsibilityIds = [
  'first_initiative',
  'follow_up',
  'damage',
  'space_creation',
  'map_control',
  'vision',
  'save',
  'control',
  'objectives',
  'farm_for_timing',
  'flexible_role',
] as const;

export type ResponsibilityId = (typeof responsibilityIds)[number];

export const fightPositionIds = [
  'frontline',
  'second_wave',
  'backline',
  'flank',
  'high_ground',
] as const;

export type FightPositionId = (typeof fightPositionIds)[number];

export const individualPlaystyleIds = [
  'initiator',
  'hunter',
  'timing_playmaker',
  'second_wave',
  'frontliner',
  'protector',
  'teamfight_controller',
  'damage_dealer',
  'tempo_player',
  'resource_player',
  'split_pusher',
  'objective_player',
  'enabler',
  'flexible',
] as const;

export type IndividualPlaystyleId = (typeof individualPlaystyleIds)[number];

export const teamPlaystyleIds = [
  'fast_tempo',
  'pickoff',
  'teamfight',
  'protect_one',
  'split_map',
  'late_game_control',
  'objective_control',
] as const;

export type TeamPlaystyleId = (typeof teamPlaystyleIds)[number];

export const poolTierIds = [
  'signature',
  'strong',
  'comfortable',
  'situational',
  'experimental',
] as const;

export type PoolTierId = (typeof poolTierIds)[number];

export const draftPhaseIds = ['early', 'middle', 'late', 'flexible'] as const;

export type DraftPhaseId = (typeof draftPhaseIds)[number];

export const primaryAttributeIds = [
  'strength',
  'agility',
  'intelligence',
  'universal',
] as const;

export type PrimaryAttributeId = (typeof primaryAttributeIds)[number];

export const questionnaireStepIds = [
  'identity',
  'general_preferences',
  'team_playstyles',
  'individual_playstyles',
  'vision',
  'summary',
  'hero_pool',
] as const;

export type QuestionnaireStepId = (typeof questionnaireStepIds)[number];

export const questionnaireStatusIds = [
  'draft',
  'completed',
  'confirmed',
] as const;
export type QuestionnaireStatus = (typeof questionnaireStatusIds)[number];
