import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type { PlayerHeroCategoryRepository } from '@/domain/repositories/hero-category-repository';
import type { PlayerHeroEvaluationRepository } from '@/domain/repositories/player-hero-evaluation-repository';

export class RemoveHeroFromPlayerPool {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly assignments?: PlayerHeroCategoryRepository,
    private readonly evaluations?: PlayerHeroEvaluationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const playerHero = await this.playerHeroes.findById(id);
    if (playerHero) {
      await this.assignments?.removeByPlayerHero(
        playerHero.playerId,
        playerHero.heroId,
      );
      await this.evaluations?.removeByPlayerHero(
        playerHero.playerId,
        playerHero.heroId,
      );
    }
    await this.playerHeroes.remove(id);
  }
}
