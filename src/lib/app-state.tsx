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
import { UpdatePlayerHeroComfortTier } from '@/application/use-cases/update-player-hero-comfort-tier';
import {
  AssignHeroCategory,
  CreateHeroCategory,
  DeleteHeroCategory,
  ListHeroCategories,
  RenameHeroCategory,
  SyncHeroCategoryAssignments,
  UnassignHeroCategory,
} from '@/application/use-cases/hero-category-use-cases';
import {
  ListCompleteHeroEvaluations,
  LoadHeroEvaluation,
  LoadLegacyHeroEvaluation,
  SaveHeroEvaluation,
} from '@/application/use-cases/hero-evaluation-use-cases';
import {
  LoadHeroMatchups,
  RemoveHeroMatchup,
  SaveHeroMatchup,
} from '@/application/use-cases/hero-matchup-use-cases';
import {
  UpdatePlayerProfile,
  type UpdatePlayerProfileInput,
} from '@/application/use-cases/update-player-profile';
import { UpdatePlayerPreferences } from '@/application/use-cases/update-player-preferences';
import type { Player } from '@/domain/entities/player';
import {
  normalizePlayerPseudo,
  normalizeSteamId,
  normalizeTeamId,
} from '@/domain/entities/player';
import type { PlayerHero } from '@/domain/entities/player-hero';
import type {
  HeroCategory,
  PlayerHeroCategory,
} from '@/domain/entities/hero-category';
import type {
  HeroMetricMap,
  LegacyPlayerHeroEvaluation,
  PlayerHeroEvaluation,
  PlayerHeroEvaluationV2,
} from '@/domain/entities/player-hero-evaluation';
import type {
  HeroMatchupScore,
  PlayerHeroMatchup,
} from '@/domain/entities/player-hero-matchup';
import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { isoClock } from '@/application/services/clock';
import { createId } from '@/application/services/id-generator';
import { heroFixture } from '@/infrastructure/repositories/hero-fixture';
import { createRepositories } from '@/infrastructure/repositories/repository-factory';
import type { PlayerHeroDraft } from '@/application/use-cases/player-hero-validation';
import type { Hero } from '@/domain/entities/hero';

interface AppDataSnapshot {
  players: Player[];
  preferences: PlayerPreferences[];
  playerHeroes: PlayerHero[];
  heroCategories: HeroCategory[];
  playerHeroCategories: PlayerHeroCategory[];
  heroEvaluations: PlayerHeroEvaluation[];
  heroMatchups: PlayerHeroMatchup[];
  heroes: Hero[];
}

interface AppStateValue {
  currentPlayer: Player | null;
  currentPreferences: PlayerPreferences | null;
  heroPool: PlayerHero[];
  heroCategories: HeroCategory[];
  playerHeroCategories: PlayerHeroCategory[];
  heroEvaluations: PlayerHeroEvaluation[];
  heroMatchups: PlayerHeroMatchup[];
  heroes: typeof heroFixture;
  error: string | null;
  resolvePlayer(identifier: string): Promise<Player | undefined>;
  updateSteamId(steamId: string): Promise<boolean>;
  updateTeamId(teamId: string): Promise<boolean>;
  createProfile(input: CreatePlayerProfileInput): Promise<boolean>;
  saveProfile(input: UpdatePlayerProfileInput): Promise<boolean>;
  updatePreferences(input: PlayerPreferences): Promise<boolean>;
  addHero(input: PlayerHeroDraft): Promise<boolean>;
  updateHero(input: PlayerHero): Promise<boolean>;
  updateHeroComfortTier(
    playerHero: PlayerHero,
    poolTier: PlayerHero['poolTier'],
  ): Promise<boolean>;
  removeHero(id: string): Promise<boolean>;
  createHeroCategory(name: string): Promise<boolean>;
  renameHeroCategory(categoryId: string, name: string): Promise<boolean>;
  deleteHeroCategory(categoryId: string): Promise<boolean>;
  assignHeroCategory(heroId: string, categoryId: string): Promise<boolean>;
  unassignHeroCategory(heroId: string, categoryId: string): Promise<boolean>;
  syncHeroCategoryAssignments(
    categoryId: string,
    heroIds: string[],
  ): Promise<boolean>;
  loadHeroEvaluation(heroId: string): Promise<PlayerHeroEvaluationV2 | null>;
  loadLegacyHeroEvaluation(
    heroId: string,
  ): Promise<LegacyPlayerHeroEvaluation | null>;
  saveHeroEvaluation(heroId: string, metrics: HeroMetricMap): Promise<boolean>;
  listCompleteHeroEvaluations(): Promise<PlayerHeroEvaluationV2[]>;
  loadHeroMatchups(heroId: string): Promise<PlayerHeroMatchup[]>;
  saveHeroMatchup(
    heroId: string,
    opponentHeroId: string,
    score: HeroMatchupScore,
  ): Promise<boolean>;
  removeHeroMatchup(heroId: string, opponentHeroId: string): Promise<boolean>;
  snapshot(): Promise<AppDataSnapshot>;
}

const AppStateContext = createContext<AppStateValue | null>(null);
const defaultTeamId = 'local-team';
const defaultPreferences = {
  farmPriority: 3,
  preferredGamePace: 3,
  cooldownDependencyComfort: 3,
  sacrificeComfort: 3,
  shotCallingComfort: 3,
  preferredFightPositions: [],
  preferredIndividualPlaystyles: [],
  preferredTeamPlaystyles: [],
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const repositories = useMemo(() => createRepositories(), []);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentPreferences, setCurrentPreferences] =
    useState<PlayerPreferences | null>(null);
  const [heroPool, setHeroPool] = useState<PlayerHero[]>([]);
  const [heroCategories, setHeroCategories] = useState<HeroCategory[]>([]);
  const [playerHeroCategories, setPlayerHeroCategories] = useState<
    PlayerHeroCategory[]
  >([]);
  const [heroEvaluations, setHeroEvaluations] = useState<
    PlayerHeroEvaluationV2[]
  >([]);
  const [heroMatchups, setHeroMatchups] = useState<PlayerHeroMatchup[]>([]);
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

  const refreshHeroCategories = useCallback(
    async (playerId: string) => {
      const result = await new ListHeroCategories(
        repositories.heroCategories,
        repositories.playerHeroCategories,
      ).execute(playerId);
      setHeroCategories(result.categories);
      setPlayerHeroCategories(result.assignments);
    },
    [repositories.heroCategories, repositories.playerHeroCategories],
  );

  const refreshHeroEvaluations = useCallback(
    async (playerId: string) => {
      setHeroEvaluations(
        (await repositories.heroEvaluations.listByPlayerId(playerId, 2)).filter(
          (item): item is PlayerHeroEvaluationV2 =>
            item.metricSchemaVersion === 2,
        ),
      );
    },
    [repositories.heroEvaluations],
  );

  const refreshHeroMatchups = useCallback(
    async (playerId: string) => {
      const pool = await repositories.playerHeroes.listByPlayerId(playerId);
      const lists = await Promise.all(
        pool.map((playerHero) =>
          repositories.heroMatchups.findByPlayerAndHero(
            playerId,
            playerHero.heroId,
          ),
        ),
      );
      setHeroMatchups(lists.flat());
    },
    [repositories.heroMatchups, repositories.playerHeroes],
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
        const userMessage = getUserMessage(caught);
        if (userMessage) {
          setError(userMessage);
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
      heroCategories,
      playerHeroCategories,
      heroEvaluations,
      heroMatchups,
      heroes: heroFixture,
      error,
      async resolvePlayer(identifier) {
        return capture(async () => {
          const displayPseudo = identifier.trim();
          const steamId = normalizeSteamId(identifier);
          const normalizedPseudo = normalizePlayerPseudo(displayPseudo);
          const existing =
            (isSteamIdLike(steamId)
              ? await repositories.players.findBySteamId(steamId)
              : null) ??
            (await repositories.players.findByNormalizedPseudo(
              normalizedPseudo,
            ));

          if (existing) {
            const existingPreferences =
              await repositories.preferences.findByPlayerId(existing.id);
            const preferences =
              existingPreferences ??
              (await repositories.preferences.save({
                playerId: existing.id,
                ...defaultPreferences,
              }));

            setCurrentPlayer(existing);
            setCurrentPreferences(preferences);
            await refreshHeroPool(existing.id);
            await refreshHeroCategories(existing.id);
            await refreshHeroEvaluations(existing.id);
            await refreshHeroMatchups(existing.id);
            return existing;
          }

          if (isSteamIdLike(steamId)) {
            throw new DomainValidationError([
              {
                code: 'not_found',
                field: 'steamId',
                message: 'Aucun profil joueur ne correspond à ce Steam ID.',
              },
            ]);
          }

          const result = await new CreatePlayerProfile(
            repositories.players,
            repositories.preferences,
            createId,
            isoClock,
          ).execute({
            teamId: defaultTeamId,
            pseudonym: displayPseudo,
            mainRole: 'position_1',
            secondaryRoles: [],
            preferences: defaultPreferences,
          });
          setCurrentPlayer(result.player);
          setCurrentPreferences(result.preferences);
          await refreshHeroPool(result.player.id);
          await refreshHeroCategories(result.player.id);
          await refreshHeroEvaluations(result.player.id);
          await refreshHeroMatchups(result.player.id);
          return result.player;
        });
      },
      async updateSteamId(steamId) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          const saved = await repositories.players.save({
            ...currentPlayer,
            steamId: normalizeSteamId(steamId),
            updatedAt: isoClock(),
          });
          setCurrentPlayer(saved);
          return true;
        });
        return Boolean(result);
      },
      async updateTeamId(teamId) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          const saved = await repositories.players.save({
            ...currentPlayer,
            teamId: normalizeTeamId(teamId),
            updatedAt: isoClock(),
          });
          setCurrentPlayer(saved);
          return true;
        });
        return Boolean(result);
      },
      async createProfile(input) {
        const result = await capture(async () => {
          const result = await new CreatePlayerProfile(
            repositories.players,
            repositories.preferences,
            createId,
            isoClock,
          ).execute({ ...input, teamId: input.teamId || defaultTeamId });
          setCurrentPlayer(result.player);
          setCurrentPreferences(result.preferences);
          await refreshHeroPool(result.player.id);
          await refreshHeroCategories(result.player.id);
          await refreshHeroEvaluations(result.player.id);
          await refreshHeroMatchups(result.player.id);
          return true;
        });
        return Boolean(result);
      },
      async saveProfile(input) {
        const result = await capture(async () => {
          const result = await new UpdatePlayerProfile(
            repositories.players,
            repositories.preferences,
            isoClock,
          ).execute(input);
          setCurrentPlayer(result.player);
          setCurrentPreferences(result.preferences);
          return true;
        });
        return Boolean(result);
      },
      async updatePreferences(input) {
        const result = await capture(async () => {
          const saved = await new UpdatePlayerPreferences(
            repositories.preferences,
          ).execute(input);
          setCurrentPreferences(saved);
          return true;
        });
        return Boolean(result);
      },
      async addHero(input) {
        const result = await capture(async () => {
          const saved = await new AddHeroToPlayerPool(
            repositories.playerHeroes,
            createId,
            isoClock,
          ).execute(input);
          setHeroPool((items) => [...items, saved]);
          return true;
        });
        return Boolean(result);
      },
      async updateHero(input) {
        const result = await capture(async () => {
          const saved = await new UpdatePlayerHero(
            repositories.playerHeroes,
            isoClock,
          ).execute(input);
          setHeroPool((items) =>
            items.map((item) => (item.id === saved.id ? saved : item)),
          );
          return true;
        });
        return Boolean(result);
      },
      async updateHeroComfortTier(playerHero, poolTier) {
        const result = await capture(async () => {
          const saved = await new UpdatePlayerHeroComfortTier(
            repositories.playerHeroes,
            isoClock,
          ).execute(playerHero, poolTier);
          setHeroPool((items) =>
            items.map((item) => (item.id === saved.id ? saved : item)),
          );
          return true;
        });
        return Boolean(result);
      },
      async removeHero(id) {
        const result = await capture(async () => {
          await new RemoveHeroFromPlayerPool(
            repositories.playerHeroes,
            repositories.playerHeroCategories,
            repositories.heroEvaluations,
            repositories.heroMatchups,
          ).execute(id);
          setHeroPool((items) => items.filter((item) => item.id !== id));
          if (currentPlayer) {
            await refreshHeroCategories(currentPlayer.id);
            await refreshHeroEvaluations(currentPlayer.id);
            await refreshHeroMatchups(currentPlayer.id);
          }
          return true;
        });
        return Boolean(result);
      },
      async createHeroCategory(name) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new CreateHeroCategory(
            repositories.heroCategories,
            createId,
            isoClock,
          ).execute(currentPlayer.id, name);
          await refreshHeroCategories(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async renameHeroCategory(categoryId, name) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new RenameHeroCategory(
            repositories.heroCategories,
            isoClock,
          ).execute(categoryId, name);
          await refreshHeroCategories(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async deleteHeroCategory(categoryId) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new DeleteHeroCategory(
            repositories.heroCategories,
            repositories.playerHeroCategories,
          ).execute(categoryId);
          await refreshHeroCategories(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async assignHeroCategory(heroId, categoryId) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new AssignHeroCategory(
            repositories.playerHeroes,
            repositories.heroCategories,
            repositories.playerHeroCategories,
            isoClock,
          ).execute(currentPlayer.id, heroId, categoryId);
          await refreshHeroCategories(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async unassignHeroCategory(heroId, categoryId) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new UnassignHeroCategory(
            repositories.playerHeroCategories,
          ).execute(currentPlayer.id, heroId, categoryId);
          await refreshHeroCategories(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async syncHeroCategoryAssignments(categoryId, heroIds) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new SyncHeroCategoryAssignments(
            repositories.playerHeroes,
            repositories.heroCategories,
            repositories.playerHeroCategories,
            isoClock,
          ).execute(currentPlayer.id, categoryId, heroIds);
          await refreshHeroCategories(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async loadHeroEvaluation(heroId) {
        if (!currentPlayer) {
          return null;
        }
        const result = await capture(async () =>
          new LoadHeroEvaluation(repositories.heroEvaluations).execute(
            currentPlayer.id,
            heroId,
          ),
        );
        return result ?? null;
      },
      async loadLegacyHeroEvaluation(heroId) {
        if (!currentPlayer) {
          return null;
        }
        const result = await capture(async () =>
          new LoadLegacyHeroEvaluation(repositories.heroEvaluations).execute(
            currentPlayer.id,
            heroId,
          ),
        );
        return result ?? null;
      },
      async saveHeroEvaluation(heroId, metrics) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new SaveHeroEvaluation(
            repositories.playerHeroes,
            repositories.heroEvaluations,
            isoClock,
          ).execute({
            playerId: currentPlayer.id,
            heroId,
            metrics,
          });
          await refreshHeroEvaluations(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async listCompleteHeroEvaluations() {
        if (!currentPlayer) {
          return [];
        }
        return (
          (await capture(async () =>
            new ListCompleteHeroEvaluations(
              repositories.heroEvaluations,
            ).execute(currentPlayer.id),
          )) ?? []
        );
      },
      async loadHeroMatchups(heroId) {
        if (!currentPlayer) {
          return [];
        }
        const result = await capture(async () =>
          new LoadHeroMatchups(repositories.heroMatchups).execute(
            currentPlayer.id,
            heroId,
          ),
        );
        return result ?? [];
      },
      async saveHeroMatchup(heroId, opponentHeroId, score) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new SaveHeroMatchup(
            repositories.playerHeroes,
            repositories.heroMatchups,
            isoClock,
          ).execute({
            playerId: currentPlayer.id,
            heroId,
            opponentHeroId,
            score,
          });
          await refreshHeroMatchups(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async removeHeroMatchup(heroId, opponentHeroId) {
        if (!currentPlayer) {
          return false;
        }
        const result = await capture(async () => {
          await new RemoveHeroMatchup(repositories.heroMatchups).execute(
            currentPlayer.id,
            heroId,
            opponentHeroId,
          );
          await refreshHeroMatchups(currentPlayer.id);
          return true;
        });
        return Boolean(result);
      },
      async snapshot() {
        return {
          players: await repositories.players.list(),
          preferences: await repositories.preferences.list(),
          playerHeroes: await repositories.playerHeroes.list(),
          heroCategories: await repositories.heroCategories.list(),
          playerHeroCategories: await repositories.playerHeroCategories.list(),
          heroEvaluations: await repositories.heroEvaluations.list(),
          heroMatchups: await repositories.heroMatchups.list(),
          heroes: await repositories.heroes.list(),
        };
      },
    }),
    [
      capture,
      currentPlayer,
      currentPreferences,
      error,
      heroEvaluations,
      heroMatchups,
      heroCategories,
      heroPool,
      playerHeroCategories,
      refreshHeroCategories,
      refreshHeroEvaluations,
      refreshHeroPool,
      refreshHeroMatchups,
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

function getUserMessage(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'userMessage' in error &&
    typeof error.userMessage === 'string'
  ) {
    return error.userMessage;
  }

  return undefined;
}

function isSteamIdLike(value: string): boolean {
  return /^\d{5,}$/.test(value);
}
