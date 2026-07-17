import type { Hero } from '@/domain/entities/hero';
import canonHeroes from '@/../data/generated/heroes.json';

export const heroes: Hero[] = canonHeroes.heroes as Hero[];

export function getHeroById(id: string): Hero | null {
  return heroes.find((hero) => hero.id === id) ?? null;
}

export function hasHeroImage(hero: Hero): boolean {
  return Boolean(hero.imageSmallUrl || hero.imageLargeUrl || hero.imageFullUrl);
}
