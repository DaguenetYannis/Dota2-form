import { describe, expect, it } from 'vitest';
import generated from '@/../data/generated/heroes.json';

describe('Hero catalogue generation', () => {
  const heroes = generated.heroes;

  it('exports the full hero catalogue with 127 heroes', () => {
    expect(heroes).toHaveLength(127);
  });

  it('keeps canonical display names distinct from legacy asset slugs', () => {
    const mapping = new Map(heroes.map((hero) => [hero.id, hero.displayName]));

    expect(mapping.get('skeleton_king')).toBe('Wraith King');
    expect(mapping.get('furion')).toBe("Nature's Prophet");
    expect(mapping.get('nevermore')).toBe('Shadow Fiend');
    expect(mapping.get('obsidian_destroyer')).toBe('Outworld Destroyer');
    expect(mapping.get('zuus')).toBe('Zeus');
    expect(mapping.get('doom_bringer')).toBe('Doom');
    expect(mapping.get('magnataur')).toBe('Magnus');
    expect(mapping.get('rattletrap')).toBe('Clockwerk');
    expect(mapping.get('shredder')).toBe('Timbersaw');
    expect(mapping.get('wisp')).toBe('Io');
    expect(mapping.get('windrunner')).toBe('Windranger');
    expect(mapping.get('necrolyte')).toBe('Necrophos');
    expect(mapping.get('life_stealer')).toBe('Lifestealer');
    expect(mapping.get('queenofpain')).toBe('Queen of Pain');
    expect(mapping.get('vengefulspirit')).toBe('Vengeful Spirit');
  });

  it('does not drop heroes without local images', () => {
    const expectedMissing = [
      'abyssal_underlord',
      'monkey_king',
      'dark_willow',
      'pangolier',
      'grimstroke',
      'hoodwink',
      'void_spirit',
      'snapfire',
      'mars',
      'ringmaster',
      'dawnbreaker',
      'marci',
      'primal_beast',
      'muerta',
      'kez',
      'largo',
    ];

    const missingHeroes = heroes.filter(
      (hero) =>
        !hero.imageSmallUrl || !hero.imageLargeUrl || !hero.imageFullUrl,
    );

    expect(missingHeroes).toHaveLength(16);
    expect(missingHeroes.map((hero) => hero.id).sort()).toEqual(
      expectedMissing.sort(),
    );
  });

  it('has no duplicate Dota IDs', () => {
    const seen = new Set<number>();
    for (const hero of heroes) {
      expect(seen.has(hero.dotaId)).toBe(false);
      seen.add(hero.dotaId);
    }
  });

  it('is sorted deterministically by dotaId', () => {
    const dotaIds = heroes.map((hero) => hero.dotaId);
    const sorted = [...dotaIds].sort((a, b) => a - b);
    expect(dotaIds).toEqual(sorted);
  });
});
