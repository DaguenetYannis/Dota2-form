import type { HeroRepository } from '@/domain/repositories/hero-repository';
import type {
  HeroCategoryRepository,
  PlayerHeroCategoryRepository,
} from '@/domain/repositories/hero-category-repository';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type { PlayerHeroEvaluationRepository } from '@/domain/repositories/player-hero-evaluation-repository';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';
import type { PlayerRepository } from '@/domain/repositories/player-repository';

export interface AppRepositories {
  players: PlayerRepository;
  preferences: PlayerPreferencesRepository;
  heroes: HeroRepository;
  playerHeroes: PlayerHeroRepository;
  heroEvaluations: PlayerHeroEvaluationRepository;
  heroCategories: HeroCategoryRepository;
  playerHeroCategories: PlayerHeroCategoryRepository;
  questionnaires: PlayerQuestionnaireRepository;
}
