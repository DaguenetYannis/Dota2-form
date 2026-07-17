import type { Hero } from '@/domain/entities/hero';

export interface HeroRepository {
  list(): Promise<Hero[]>;
  findById(id: string): Promise<Hero | null>;
}
