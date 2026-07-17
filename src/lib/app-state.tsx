'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AddHeroToPlayerPool } from '@/application/use-cases/add-hero-to-player-pool';
import {
  CreatePlayerProfile,
  type CreatePlayerProfileInput,
} from '@/application/use-cases/create-player-profile';
import { ListPlayerHeroPool } from '@/application/use-cases/list-player-hero-pool';
import { RemoveHeroFromPlayerPool } from '@/application/use-cases/remove-hero-from-player-pool';
import { UpdatePlayerHero } from '@/application/use-cases/update-player-hero';
import { UpdatePlayerPreferences } from '@/application/use-cases/update-player-preferences';
import type { Player } from '@/domain/entities/player';
import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { isoClock } from '@/application/services/clock';
import { createId } from '@/application/services/id-generator';
import { heroFixture } from '@/infrastructure/repositories/hero-fixture';
import { createRepositories } from '@/infrastructure/repositories/repository-factory';
import type { PlayerHeroDraft } from '@/application/use-cases/player-hero-validation';

interface AppDataSnapshot {
  players: Player[];
  preferences: PlayerPreferences[];
  playerHeroes: PlayerHero[];
  heroes: typeof heroFixture;
}

interface AppStateValue {
  currentPlayer: Player | null;
  currentPreferences: PlayerPreferences | null;
  heroPool: PlayerHero[];
  heroes: typeof heroFixture;
  error: string | null;
  createProfile(input: CreatePlayerProfileInput): Promise<void>;
  updatePreferences(input: PlayerPreferences): Promise<void>;
  addHero(input: PlayerHeroDraft): Promise<void>;
  updateHero(input: PlayerHero): Promise<void>;
  removeHero(id: string): Promise<void>;
  snapshot(): Promise<AppDataSnapshot>;
}

const AppStateContext = createContext<AppStateValue | null>(null);
const defaultTeamId = 'local-team';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const repositories = useMemo(() => createRepositories(), []);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentPreferences, setCurrentPreferences] =
    useState<PlayerPreferences | null>(null);
  const [heroPool, setHeroPool] = useState<PlayerHero[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshHeroPool = useCallback(
    async (playerId: string) => {
      const list = await new ListPlayerHeroPool(
        repositories.playerHeroes,
      ).execute(playerId);
      setHeroPool(list);
    },
    [repositories.playerHeroes],
  );

  const capture = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
      try {
        setError(null);
        return await operation();
      } catch (caught) {
        if (caught instanceof DomainValidationError) {
          setError(caught.errors.map((item) => item.message).join(' '));
          return undefined;
        }
        setError('Une erreur inattendue est survenue.');
        return undefined;
      }
    },
    [],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      currentPlayer,
      currentPreferences,
      heroPool,
      heroes: heroFixture,
      error,
      async createProfile(input) {
        await capture(async () => {
          const result = await new CreatePlayerProfile(
            repositories.players,
            repositories.preferences,
            createId,
            isoClock,
          ).execute({ ...input, teamId: input.teamId || defaultTeamId });
          setCurrentPlayer(result.player);
          setCurrentPreferences(result.preferences);
          await refreshHeroPool(result.player.id);
        });
      },
      async updatePreferences(input) {
        await capture(async () => {
          const saved = await new UpdatePlayerPreferences(
            repositories.preferences,
          ).execute(input);
          setCurrentPreferences(saved);
        });
      },
      async addHero(input) {
        await capture(async () => {
          const saved = await new AddHeroToPlayerPool(
            repositories.playerHeroes,
            createId,
            isoClock,
          ).execute(input);
          setHeroPool((items) => [...items, saved]);
        });
      },
      async updateHero(input) {
        await capture(async () => {
          const saved = await new UpdatePlayerHero(
            repositories.playerHeroes,
            isoClock,
          ).execute(input);
          setHeroPool((items) =>
            items.map((item) => (item.id === saved.id ? saved : item)),
          );
        });
      },
      async removeHero(id) {
        await capture(async () => {
          await new RemoveHeroFromPlayerPool(repositories.playerHeroes).execute(
            id,
          );
          setHeroPool((items) => items.filter((item) => item.id !== id));
        });
      },
      async snapshot() {
        return {
          players: await repositories.players.list(),
          preferences: await repositories.preferences.list(),
          playerHeroes: await repositories.playerHeroes.list(),
          heroes: await repositories.heroes.list(),
        };
      },
    }),
    [
      capture,
      currentPlayer,
      currentPreferences,
      error,
      heroPool,
      refreshHeroPool,
      repositories,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return value;
}
