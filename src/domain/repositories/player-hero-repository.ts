import type { PlayerHero } from '@/domain/entities/player-hero';

export interface PlayerHeroRepository {
  add(playerHero: PlayerHero): Promise<PlayerHero>;
  update(playerHero: PlayerHero): Promise<PlayerHero>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<PlayerHero | null>;
  findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHero | null>;
  listByPlayerId(playerId: string): Promise<PlayerHero[]>;
  list(): Promise<PlayerHero[]>;
}
