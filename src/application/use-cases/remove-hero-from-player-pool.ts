import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';

export class RemoveHeroFromPlayerPool {
  constructor(private readonly playerHeroes: PlayerHeroRepository) {}

  async execute(id: string): Promise<void> {
    await this.playerHeroes.remove(id);
  }
}
