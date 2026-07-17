import Image from 'next/image';
import type { Hero } from '@/domain/entities/hero';
import { resolveHeroImageAlt, resolveHeroImageUrl } from '@/lib/hero-image';

const sizeDimensions = {
  small: { width: 59, height: 33 },
  large: { width: 205, height: 115 },
  full: { width: 256, height: 144 },
};

export function HeroThumbnail({
  hero,
  size,
  className,
}: {
  hero: Hero;
  size: 'small' | 'large' | 'full';
  className?: string;
}) {
  const { width, height } = sizeDimensions[size];
  return (
    <Image
      src={resolveHeroImageUrl(hero, size)}
      alt={resolveHeroImageAlt(hero)}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}
