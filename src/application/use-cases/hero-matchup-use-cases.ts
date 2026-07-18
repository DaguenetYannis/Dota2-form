import type { Clock } from '@/application/services/clock';
import type { Hero } from '@/domain/entities/hero';
import {
  getHeroMatchupGroup,
  isHeroMatchupScore,
  type HeroMatchupGroup,
  type HeroMatchupScore,
  type PlayerHeroMatchup,
} from '@/domain/entities/player-hero-matchup';
import type { PlayerHeroMatchupRepository } from '@/domain/repositories/player-hero-matchup-repository';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { compareHeroesByDisplayName } from '@/lib/sort-heroes';

export class LoadHeroMatchups {
  constructor(private readonly matchups: PlayerHeroMatchupRepository) {}

  async execute(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroMatchup[]> {
    return this.matchups.findByPlayerAndHero(playerId, heroId);
  }
}

export class SaveHeroMatchup {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly matchups: PlayerHeroMatchupRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    playerId: string;
    heroId: string;
    opponentHeroId: string;
    score: HeroMatchupScore;
  }): Promise<PlayerHeroMatchup> {
    assertValidMatchupInput(input);
    const playerHero = await this.playerHeroes.findByPlayerAndHero(
      input.playerId,
      input.heroId,
    );
    if (!playerHero) {
      throw new DomainValidationError([
        {
          code: 'not_found',
          field: 'playerHero',
          message:
            "Tu dois ajouter ce héros à ton hero pool avant d'évaluer ses matchups.",
        },
      ]);
    }

    const existing = await this.matchups.findByPlayerHeroAndOpponent(
      input.playerId,
      input.heroId,
      input.opponentHeroId,
    );
    const now = this.clock();
    return this.matchups.save({
      playerId: input.playerId,
      heroId: input.heroId,
      opponentHeroId: input.opponentHeroId,
      score: input.score,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }
}

export class RemoveHeroMatchup {
  constructor(private readonly matchups: PlayerHeroMatchupRepository) {}

  async execute(
    playerId: string,
    heroId: string,
    opponentHeroId: string,
  ): Promise<void> {
    await this.matchups.remove(playerId, heroId, opponentHeroId);
  }
}

export function assertValidMatchupInput(input: {
  heroId: string;
  opponentHeroId: string;
  score: unknown;
}): void {
  if (input.heroId === input.opponentHeroId) {
    throw new DomainValidationError([
      {
        code: 'invalid_option',
        field: 'opponentHeroId',
        message: 'Un héros ne peut pas être son propre matchup.',
      },
    ]);
  }
  if (!isHeroMatchupScore(input.score)) {
    throw new DomainValidationError([
      {
        code: 'out_of_range',
        field: 'score',
        message: 'Le score de matchup doit être compris entre 0 et 6.',
      },
    ]);
  }
}

export function groupHeroMatchups(
  matchups: PlayerHeroMatchup[],
): Record<HeroMatchupGroup, PlayerHeroMatchup[]> {
  return {
    avoid: matchups.filter(
      (matchup) => getHeroMatchupGroup(matchup.score) === 'avoid',
    ),
    neutral: matchups.filter(
      (matchup) => getHeroMatchupGroup(matchup.score) === 'neutral',
    ),
    favorable: matchups.filter(
      (matchup) => getHeroMatchupGroup(matchup.score) === 'favorable',
    ),
  };
}

export function sortMatchupsForSummary(
  matchups: PlayerHeroMatchup[],
  heroesById: Map<string, Hero>,
  group: HeroMatchupGroup,
): PlayerHeroMatchup[] {
  return [...matchups].sort((left, right) => {
    if (group === 'avoid' && left.score !== right.score) {
      return left.score - right.score;
    }
    if (group === 'favorable' && left.score !== right.score) {
      return right.score - left.score;
    }
    const leftHero = heroesById.get(left.opponentHeroId) ?? {
      id: left.opponentHeroId,
      displayName: left.opponentHeroId,
    };
    const rightHero = heroesById.get(right.opponentHeroId) ?? {
      id: right.opponentHeroId,
      displayName: right.opponentHeroId,
    };
    return compareHeroesByDisplayName(leftHero, rightHero);
  });
}
