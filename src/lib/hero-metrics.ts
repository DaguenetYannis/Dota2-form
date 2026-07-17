import {
  heroMetricIds,
  type HeroMetricId,
  type PlayerHeroEvaluationV2,
} from '@/domain/entities/player-hero-evaluation';

export interface HeroMetricCopy {
  label: string;
  meaning: string;
  helper: string;
  makeQuestion(heroName: string): string;
  low: string;
  mid: string;
  high: string;
}

export const heroMetricCopy: Record<HeroMetricId, HeroMetricCopy> = {
  mobility: {
    label: 'Mobilit\u00e9',
    meaning:
      'Capacit\u00e9 du h\u00e9ros \u00e0 se d\u00e9placer, rejoindre une action, franchir le terrain, engager, se d\u00e9sengager ou se repositionner.',
    helper:
      "Pense aux d\u00e9placements sur la carte, aux franchissements de terrain et \u00e0 la capacit\u00e9 d'entrer ou de sortir d'un combat.",
    makeQuestion: (heroName) =>
      `Quand tu joues ${heroName}, \u00e0 quel point peux-tu te d\u00e9placer, rejoindre une action ou te repositionner rapidement ?`,
    low: 'Mobilit\u00e9 tr\u00e8s limit\u00e9e',
    mid: 'Mobilit\u00e9 utile dans certaines situations',
    high: 'La mobilit\u00e9 est une qualit\u00e9 centrale du h\u00e9ros',
  },
  hero_damage: {
    label: 'D\u00e9g\u00e2ts aux h\u00e9ros',
    meaning:
      'Capacit\u00e9 \u00e0 menacer les h\u00e9ros adverses par du burst, des d\u00e9g\u00e2ts soutenus ou une pression offensive r\u00e9elle.',
    helper:
      'Prends en compte le burst, les d\u00e9g\u00e2ts soutenus et la capacit\u00e9 \u00e0 forcer un adversaire \u00e0 reculer.',
    makeQuestion: (heroName) =>
      `Quelle pression de d\u00e9g\u00e2ts peux-tu exercer sur les h\u00e9ros adverses avec ${heroName} ?`,
    low: 'Faible pression de d\u00e9g\u00e2ts',
    mid: 'Pression significative dans les bonnes situations',
    high: 'Les d\u00e9g\u00e2ts aux h\u00e9ros sont une qualit\u00e9 centrale',
  },
  farm_dependency: {
    label: 'D\u00e9pendance au farm',
    meaning:
      "Quantit\u00e9 de farm, de niveaux et d'objets n\u00e9cessaires avant que le h\u00e9ros puisse remplir correctement sa fonction.",
    helper:
      'Une valeur \u00e9lev\u00e9e indique une forte d\u00e9pendance aux ressources, pas une meilleure qualit\u00e9 du h\u00e9ros.',
    makeQuestion: (heroName) =>
      `De combien de farm, de niveaux et d'objets as-tu besoin pour \u00eatre r\u00e9ellement utile avec ${heroName} ?`,
    low: 'Tr\u00e8s peu de ressources n\u00e9cessaires',
    mid: 'Besoin mod\u00e9r\u00e9',
    high: 'Forte d\u00e9pendance au farm',
  },
  building_damage: {
    label: 'D\u00e9g\u00e2ts aux b\u00e2timents',
    meaning:
      "Capacit\u00e9 \u00e0 transformer une fen\u00eatre en d\u00e9g\u00e2ts sur les tours, les barracks ou l'Ancient.",
    helper:
      "\u00c9value la capacit\u00e9 \u00e0 convertir une fen\u00eatre en d\u00e9g\u00e2ts sur les tours, les barracks ou l'Ancient.",
    makeQuestion: (heroName) =>
      `\u00c0 quel point peux-tu menacer rapidement les b\u00e2timents adverses avec ${heroName} ?`,
    low: 'Tr\u00e8s peu de d\u00e9g\u00e2ts aux b\u00e2timents',
    mid: 'Pression situationnelle',
    high: 'Les d\u00e9g\u00e2ts aux b\u00e2timents sont une qualit\u00e9 centrale',
  },
  enabler: {
    label: 'Enabler',
    meaning:
      "Capacit\u00e9 \u00e0 rendre les actions alli\u00e9es plus faciles ou plus puissantes gr\u00e2ce aux buffs, soins non urgents, vision, mana, vitesse, r\u00e9duction d'armure, placement ou pr\u00e9paration d'une cible.",
    helper:
      'Pense aux buffs, soins, ressources, informations, placements ou effets qui am\u00e9liorent directement le jeu des alli\u00e9s.',
    makeQuestion: (heroName) =>
      `\u00c0 quel point ${heroName} te permet-il de rendre les actions de tes alli\u00e9s plus faciles ou plus puissantes ?`,
    low: 'Facilite peu le jeu des alli\u00e9s',
    mid: 'Facilitation utile dans certaines situations',
    high: 'Enabler est une fonction centrale du h\u00e9ros',
  },
  save: {
    label: 'Save',
    meaning:
      "Capacit\u00e9 \u00e0 emp\u00eacher directement ou imm\u00e9diatement la mort d'un alli\u00e9 ou \u00e0 le sortir d'une situation dangereuse.",
    helper:
      'Pense aux soins critiques, dispels, immunit\u00e9s, r\u00e9ductions de d\u00e9g\u00e2ts, repositionnements et autres outils de sauvetage.',
    makeQuestion: (heroName) =>
      `\u00c0 quel point peux-tu emp\u00eacher directement un alli\u00e9 de mourir ou le sortir d'une situation dangereuse avec ${heroName} ?`,
    low: 'Aucun ou tr\u00e8s peu de save',
    mid: 'Save disponible dans certaines situations',
    high: 'Le save est une fonction centrale du h\u00e9ros',
  },
  control: {
    label: 'Contr\u00f4le',
    meaning:
      'Capacit\u00e9 \u00e0 limiter les mouvements, les actions ou les d\u00e9cisions adverses.',
    helper:
      "Prends en compte la fiabilit\u00e9, la dur\u00e9e, la port\u00e9e et l'\u00e9tendue des contr\u00f4les.",
    makeQuestion: (heroName) =>
      `\u00c0 quel point peux-tu limiter les mouvements ou les actions adverses avec ${heroName} ?`,
    low: 'Tr\u00e8s peu de contr\u00f4le',
    mid: 'Contr\u00f4le utile mais situationnel',
    high: 'Le contr\u00f4le est une qualit\u00e9 centrale du h\u00e9ros',
  },
  teamfight: {
    label: 'Teamfight',
    meaning:
      'Capacit\u00e9 globale \u00e0 peser sur un combat impliquant plusieurs h\u00e9ros.',
    helper:
      " \u00c9value l'ampleur de ton impact sur la structure et le d\u00e9roulement d'un combat group\u00e9.".trim(),
    makeQuestion: (heroName) =>
      `\u00c0 quel point peux-tu peser sur un combat impliquant plusieurs h\u00e9ros avec ${heroName} ?`,
    low: 'Impact limit\u00e9 en teamfight',
    mid: 'Impact significatif dans certaines situations',
    high: 'Le teamfight est une qualit\u00e9 centrale du h\u00e9ros',
  },
  initiation: {
    label: 'Initiation',
    meaning:
      "Capacit\u00e9 \u00e0 cr\u00e9er volontairement le d\u00e9but d'un engagement favorable et \u00e0 forcer une r\u00e9action adverse.",
    helper:
      '\u00c0 la port\u00e9e, la rapidit\u00e9, la fiabilit\u00e9 et la capacit\u00e9 \u00e0 engager sans \u00eatre imm\u00e9diatement puni.'.replace(
        /^\u00c0/,
        'Pense \u00e0',
      ),
    makeQuestion: (heroName) =>
      `\u00c0 quel point peux-tu d\u00e9marrer ou forcer un engagement favorable avec ${heroName} ?`,
    low: 'Initie rarement les combats',
    mid: 'Peut initier dans les bonnes situations',
    high: "L'initiation est une fonction centrale du h\u00e9ros",
  },
};

export interface RadarPoint {
  metricId: HeroMetricId;
  label: string;
  value: number;
}

export interface RadarSeries {
  heroId: string;
  heroName: string;
  points: RadarPoint[];
}

export function toRadarSeries(
  evaluation: PlayerHeroEvaluationV2,
  heroName: string,
): RadarSeries | null {
  const points = heroMetricIds.map((metricId) => {
    const value = evaluation.metrics[metricId];
    if (value === null) {
      return null;
    }
    return {
      metricId,
      label: heroMetricCopy[metricId].label,
      value,
    };
  });

  if (points.some((point) => point === null)) {
    return null;
  }

  return {
    heroId: evaluation.heroId,
    heroName,
    points: points as RadarPoint[],
  };
}
