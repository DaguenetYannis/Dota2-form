import type {
  DraftPhaseId,
  FightPositionId,
  IndividualPlaystyleId,
  PoolTierId,
  RoleId,
  TeamPlaystyleId,
} from '@/domain/value-objects/vocabularies';

export const roleLabels: Record<RoleId, string> = {
  position_1: 'Position 1',
  position_2: 'Position 2',
  position_3: 'Position 3',
  position_4: 'Position 4',
  position_5: 'Position 5',
};

export const fightPositionLabels: Record<FightPositionId, string> = {
  frontline: 'Premiere ligne',
  second_wave: 'Deuxieme vague',
  backline: 'Arriere ligne',
  flank: 'Flanc',
  high_ground: 'Hauteur',
};

export const individualPlaystyleLabels: Record<IndividualPlaystyleId, string> =
  {
    initiator: 'Initiateur',
    hunter: 'Chasseur',
    timing_playmaker: 'Createur de timing',
    second_wave: 'Deuxieme vague',
    frontliner: 'Frontliner',
    protector: 'Protecteur',
    teamfight_controller: 'Controle teamfight',
    damage_dealer: 'Degats',
    tempo_player: 'Tempo',
    resource_player: 'Ressources',
    split_pusher: 'Split push',
    objective_player: 'Objectifs',
    enabler: 'Facilitateur',
    flexible: 'Flexible',
  };

export const teamPlaystyleLabels: Record<TeamPlaystyleId, string> = {
  fast_tempo: 'Tempo rapide',
  pickoff: 'Pickoff',
  teamfight: 'Teamfight',
  protect_one: 'Protect one',
  split_map: 'Split map',
  late_game_control: 'Controle late game',
};

export const poolTierLabels: Record<PoolTierId, string> = {
  signature: 'Signature',
  strong: 'Tres fort',
  comfortable: 'Confortable',
  situational: 'Situationnel',
  experimental: 'Experimental',
};

export const draftPhaseLabels: Record<DraftPhaseId, string> = {
  early: 'Early',
  middle: 'Middle',
  late: 'Late',
  flexible: 'Flexible',
};
