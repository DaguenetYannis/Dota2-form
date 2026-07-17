import type { HeroRepository } from '@/domain/repositories/hero-repository';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';
import type { PlayerRepository } from '@/domain/repositories/player-repository';

export interface AppRepositories {
  players: PlayerRepository;
  preferences: PlayerPreferencesRepository;
  heroes: HeroRepository;
  playerHeroes: PlayerHeroRepository;
}
