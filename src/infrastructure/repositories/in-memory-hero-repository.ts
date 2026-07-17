import type { Hero } from '@/domain/entities/hero';
import type { HeroRepository } from '@/domain/repositories/hero-repository';
import { heroFixture } from './hero-fixture';

export class InMemoryHeroRepository implements HeroRepository {
  constructor(private readonly heroes: Hero[] = heroFixture) {}

  async list(): Promise<Hero[]> {
    return [...this.heroes];
  }

  async findById(id: string): Promise<Hero | null> {
    return this.heroes.find((hero) => hero.id === id) ?? null;
  }
}
