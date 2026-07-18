export type HeroMatchupScore = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PlayerHeroMatchup {
  playerId: string;
  heroId: string;
  opponentHeroId: string;
  score: HeroMatchupScore;
  createdAt: string;
  updatedAt: string;
}

export const heroMatchupScores = [0, 1, 2, 3, 4, 5, 6] as const;

export type MatchupCategory = 'avoid' | 'neutral' | 'favorable';
export type HeroMatchupGroup = MatchupCategory;

export function getMatchupCategory(score: HeroMatchupScore): MatchupCategory {
  if (score <= 1) {
    return 'avoid';
  }
  if (score <= 4) {
    return 'neutral';
  }
  return 'favorable';
}

export const getHeroMatchupGroup = getMatchupCategory;

export function isHeroMatchupScore(value: unknown): value is HeroMatchupScore {
  return (
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6
  );
}
