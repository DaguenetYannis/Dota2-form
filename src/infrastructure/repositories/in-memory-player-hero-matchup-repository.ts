import type { PlayerHeroMatchup } from '@/domain/entities/player-hero-matchup';
import type { PlayerHeroMatchupRepository } from '@/domain/repositories/player-hero-matchup-repository';

export class InMemoryPlayerHeroMatchupRepository implements PlayerHeroMatchupRepository {
  private readonly matchups = new Map<string, PlayerHeroMatchup>();

  async findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroMatchup[]> {
    return Array.from(this.matchups.values()).filter(
      (matchup) => matchup.playerId === playerId && matchup.heroId === heroId,
    );
  }

  async findByPlayerHeroAndOpponent(
    playerId: string,
    heroId: string,
    opponentHeroId: string,
  ): Promise<PlayerHeroMatchup | null> {
    return this.matchups.get(key(playerId, heroId, opponentHeroId)) ?? null;
  }

  async save(matchup: PlayerHeroMatchup): Promise<PlayerHeroMatchup> {
    this.matchups.set(
      key(matchup.playerId, matchup.heroId, matchup.opponentHeroId),
      matchup,
    );
    return matchup;
  }

  async remove(
    playerId: string,
    heroId: string,
    opponentHeroId: string,
  ): Promise<void> {
    this.matchups.delete(key(playerId, heroId, opponentHeroId));
  }

  async removeByPlayerHero(playerId: string, heroId: string): Promise<void> {
    for (const matchup of this.matchups.values()) {
      if (matchup.playerId === playerId && matchup.heroId === heroId) {
        this.matchups.delete(
          key(matchup.playerId, matchup.heroId, matchup.opponentHeroId),
        );
      }
    }
  }

  async list(): Promise<PlayerHeroMatchup[]> {
    return Array.from(this.matchups.values());
  }
}

function key(playerId: string, heroId: string, opponentHeroId: string): string {
  return `${playerId}::${heroId}::${opponentHeroId}`;
}
