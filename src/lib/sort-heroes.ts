import type { Hero } from '@/domain/entities/hero';

const heroNameCollator = new Intl.Collator('fr', {
  sensitivity: 'base',
  numeric: true,
});

export function compareHeroesByDisplayName(
  left: Pick<Hero, 'id' | 'displayName'>,
  right: Pick<Hero, 'id' | 'displayName'>,
): number {
  const byName = heroNameCollator.compare(left.displayName, right.displayName);
  return byName === 0 ? left.id.localeCompare(right.id) : byName;
}

export function sortHeroesByDisplayName<T>(
  items: readonly T[],
  resolveHero: (item: T) => Pick<Hero, 'id' | 'displayName'> | null | undefined,
): T[] {
  return [...items].sort((left, right) => {
    const leftHero = resolveHero(left);
    const rightHero = resolveHero(right);
    return compareHeroesByDisplayName(
      leftHero ?? { id: fallbackId(left), displayName: fallbackId(left) },
      rightHero ?? { id: fallbackId(right), displayName: fallbackId(right) },
    );
  });
}

function fallbackId(value: unknown): string {
  if (typeof value === 'object' && value !== null && 'heroId' in value) {
    const heroId = (value as { heroId?: unknown }).heroId;
    return typeof heroId === 'string' ? heroId : '';
  }
  return '';
}
