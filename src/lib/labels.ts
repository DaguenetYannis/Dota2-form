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

export const roleDescriptions: Record<RoleId, string> = {
  position_1: 'Carry principal, souvent prioritaire en farm et en scaling.',
  position_2: 'Midlaner, responsable du tempo et des premiers mouvements clés.',
  position_3:
    "Offlaner, souvent créateur d'espace, d'initiation ou de pression.",
  position_4: 'Support mobile, actif sur la carte et les rotations.',
  position_5:
    "Hard support, stabilité de lane, vision et protection de l'équipe.",
};

export const fightPositionLabels: Record<FightPositionId, string> = {
  frontline: 'Frontline',
  second_wave: 'Deuxième vague',
  backline: 'Backline',
  flank: 'Flanc',
  high_ground: 'Hauteur',
};

export const fightPositionDescriptions: Record<FightPositionId, string> = {
  frontline:
    'Jouer devant pour engager, absorber la pression ou révéler les positions ennemies.',
  second_wave:
    "Entrer juste après l'initiation pour enchaîner ou retourner le combat.",
  backline:
    'Rester derrière pour infliger des dégâts, sauver ou contrôler à distance.',
  flank:
    'Arriver depuis un côté pour surprendre une cible ou casser la formation adverse.',
  high_ground:
    "Utiliser la vision et le terrain pour contrôler l'entrée du combat.",
};

export const individualPlaystyleLabels: Record<IndividualPlaystyleId, string> =
  {
    initiator: 'Initiateur',
    hunter: 'Chasseur',
    timing_playmaker: 'Créateur de timing',
    second_wave: 'Deuxième vague',
    frontliner: 'Frontliner',
    protector: 'Protecteur',
    teamfight_controller: 'Contrôle teamfight',
    damage_dealer: 'Dégâts',
    tempo_player: 'Tempo',
    resource_player: 'Ressources',
    split_pusher: 'Split push',
    objective_player: 'Objectifs',
    enabler: 'Facilitateur',
    flexible: 'Flexible',
  };

export const individualPlaystyleDescriptions: Record<
  IndividualPlaystyleId,
  string
> = {
  initiator: "Ouvrir les combats et forcer l'équipe ennemie à réagir.",
  hunter: 'Chercher les héros isolés et punir les erreurs de positionnement.',
  timing_playmaker:
    'Exploiter un niveau, un objet ou un cooldown pour créer une fenêtre forte.',
  second_wave:
    'Attendre la première action puis entrer au bon moment pour décider le combat.',
  frontliner: 'Jouer au contact et permettre aux alliés de jouer derrière toi.',
  protector: "Sauver, couvrir ou sécuriser les héros importants de l'équipe.",
  teamfight_controller:
    'Structurer le combat avec des contrôles, zones ou sorts de disruption.',
  damage_dealer:
    'Prioriser la pression de dégâts dans les combats et objectifs.',
  tempo_player:
    "Accélérer la partie par des mouvements fréquents et des prises d'initiative.",
  resource_player: 'Transformer farm, niveaux et objets en impact plus tardif.',
  split_pusher:
    "Mettre la pression sur les lanes et forcer l'ennemi à se séparer.",
  objective_player:
    'Jouer autour des tours, Roshan, lanes et timings collectifs.',
  enabler:
    'Rendre les actions des alliés plus faciles par les saves, buffs, contrôles ou placements.',
  flexible:
    "Adapter ton rôle selon la draft, les besoins de l'équipe et l'état de la partie.",
};

export const teamPlaystyleLabels: Record<TeamPlaystyleId, string> = {
  fast_tempo: 'Tempo rapide',
  pickoff: 'Pick-off',
  teamfight: 'Teamfight',
  protect_one: 'Protéger un core',
  split_map: 'Split map',
  late_game_control: 'Contrôle du late game',
  objective_control: 'Contrôle des objectifs',
};

export const teamPlaystyleDescriptions: Record<TeamPlaystyleId, string> = {
  fast_tempo:
    "Jouer vite, prendre l'initiative et convertir les premiers avantages.",
  pickoff:
    'Chercher des éliminations ciblées avant de prendre objectifs ou vision.',
  teamfight:
    'Construire autour de combats groupés et de gros timings de sorts.',
  protect_one: "Jouer pour sécuriser la partie d'un héros central.",
  split_map:
    'Étirer la carte, éviter les combats forcés et gagner par pression latérale.',
  late_game_control:
    'Stabiliser la partie et jouer pour des timings tardifs maîtrisés.',
  objective_control:
    'Prioriser les tours, Roshan, zones de vision et accès à la carte.',
};

export const poolTierLabels: Record<PoolTierId, string> = {
  signature: 'Signature',
  strong: 'Très confortable',
  comfortable: 'Confortable',
  situational: 'Situationnel',
  experimental: 'En apprentissage',
};

export const poolTierDescriptions: Record<PoolTierId, string> = {
  signature:
    "Un héros que tu maîtrises particulièrement bien et que l'équipe peut construire autour de toi.",
  strong:
    'Un héros que tu peux jouer avec confiance dans la plupart des parties adaptées.',
  comfortable:
    'Un héros que tu joues correctement lorsque la draft et la partie lui conviennent.',
  situational:
    'Un héros que tu peux sortir dans certaines drafts ou pour répondre à un besoin précis.',
  experimental:
    'Un héros que tu veux travailler, mais que tu ne considères pas encore comme fiable.',
};

export const draftPhaseLabels: Record<DraftPhaseId, string> = {
  early: 'Début de draft',
  middle: 'Milieu de draft',
  late: 'Fin de draft',
  flexible: 'Flexible',
};
