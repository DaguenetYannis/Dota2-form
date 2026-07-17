import type { Hero } from '@/domain/entities/hero';

export type HeroImageSize = 'small' | 'large' | 'full';

const imageSizeFieldMap: Record<HeroImageSize, keyof Hero> = {
  small: 'imageSmallUrl',
  large: 'imageLargeUrl',
  full: 'imageFullUrl',
};

export function resolveHeroImageUrl(hero: Hero, size: HeroImageSize): string {
  const url = hero[imageSizeFieldMap[size]] as string | null;
  return url ?? '/dota2heroes/placeholder.svg';
}

export function resolveHeroImageAlt(hero: Hero): string {
  return `${hero.displayName} hero image`;
}
