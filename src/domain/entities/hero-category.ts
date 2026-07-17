export interface HeroCategory {
  id: string;
  ownerPlayerId: string;
  name: string;
  normalizedName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerHeroCategory {
  playerId: string;
  heroId: string;
  categoryId: string;
  createdAt: string;
}

export function normalizeHeroCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase();
}
