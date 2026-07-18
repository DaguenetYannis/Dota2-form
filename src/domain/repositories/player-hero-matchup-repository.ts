import type { PlayerHeroMatchup } from '@/domain/entities/player-hero-matchup';

export interface PlayerHeroMatchupRepository {
  findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroMatchup[]>;
  findByPlayerHeroAndOpponent(
    playerId: string,
    heroId: string,
    opponentHeroId: string,
  ): Promise<PlayerHeroMatchup | null>;
  save(matchup: PlayerHeroMatchup): Promise<PlayerHeroMatchup>;
  remove(
    playerId: string,
    heroId: string,
    opponentHeroId: string,
  ): Promise<void>;
  removeByPlayerHero(playerId: string, heroId: string): Promise<void>;
  list(): Promise<PlayerHeroMatchup[]>;
}
