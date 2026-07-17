import type { Hero } from '@/domain/entities/hero';
import catalogue from '../../../data/generated/heroes.json';

export const heroFixture: Hero[] = catalogue.heroes as Hero[];
