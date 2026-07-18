import { describe, expect, it } from 'vitest';
import { assertValidFightEntryWindow } from './player-hero-timing';

describe('player hero fight-entry timing', () => {
  it('accepts null/null and valid 0-60 minute windows', () => {
    expect(() =>
      assertValidFightEntryWindow({
        fightEntryStartMinute: null,
        fightEntryEndMinute: null,
      }),
    ).not.toThrow();
    expect(() =>
      assertValidFightEntryWindow({
        fightEntryStartMinute: 0,
        fightEntryEndMinute: 10,
      }),
    ).not.toThrow();
    expect(() =>
      assertValidFightEntryWindow({
        fightEntryStartMinute: 50,
        fightEntryEndMinute: 60,
      }),
    ).not.toThrow();
  });

  it('rejects partial, out-of-bounds, and inverted windows', () => {
    expect(() =>
      assertValidFightEntryWindow({
        fightEntryStartMinute: 20,
        fightEntryEndMinute: null,
      }),
    ).toThrow();
    expect(() =>
      assertValidFightEntryWindow({
        fightEntryStartMinute: -1,
        fightEntryEndMinute: 10,
      }),
    ).toThrow();
    expect(() =>
      assertValidFightEntryWindow({
        fightEntryStartMinute: 30,
        fightEntryEndMinute: 20,
      }),
    ).toThrow();
  });
});
