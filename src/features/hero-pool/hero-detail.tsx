'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  filterHeroMatchupCatalogue,
  getHeroMatchupCatalogueCounts,
  type MatchupCategoryFilter,
} from '@/application/queries/filter-hero-matchup-catalogue';
import { HeroThumbnail } from '@/components/hero-thumbnail';
import { SaveStatus, type SaveState } from '@/components/save-status';
import type { Hero } from '@/domain/entities/hero';
import {
  getMatchupCategory,
  heroMatchupScores,
  type MatchupCategory,
  type HeroMatchupScore,
  type PlayerHeroMatchup,
} from '@/domain/entities/player-hero-matchup';
import {
  createEmptyHeroMetricMap,
  getHeroEvaluationProgress,
  heroMetricIds,
  isCompleteHeroEvaluation,
  type HeroMetricId,
  type HeroMetricMap,
  type HeroMetricScore,
  type LegacyPlayerHeroEvaluation,
  type PlayerHeroEvaluationV2,
} from '@/domain/entities/player-hero-evaluation';
import { useAppState } from '@/lib/app-state';
import {
  heroMetricCopy,
  toRadarSeries,
  type RadarSeries,
} from '@/lib/hero-metrics';
import { poolTierLabels } from '@/lib/labels';
import { sortHeroesByDisplayName } from '@/lib/sort-heroes';

type MatchupSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const zeroMetricLabels: Record<HeroMetricId, string> = {
  mobility: 'Aucune mobilité particulière',
  hero_damage: "N'apporte pratiquement pas de dégâts aux héros",
  farm_dependency: 'Aucun besoin particulier de farm',
  building_damage: "N'apporte pratiquement pas de dégâts aux bâtiments",
  enabler: 'Ne facilite pas particulièrement le jeu des alliés',
  save: 'Aucun outil de save',
  control: 'Aucun contrôle significatif',
  teamfight: "Aucun impact particulier en combat d'équipe",
  initiation: "Ne permet pas d'initier",
};

const matchupScoreLabels: Record<HeroMatchupScore, string> = {
  0: 'Ce héros neutralise complètement le mien.',
  1: 'Le matchup est très défavorable pour mon héros.',
  2: 'Le matchup est légèrement défavorable pour mon héros.',
  3: "Le matchup n'est ni favorable ni défavorable.",
  4: 'Le matchup est légèrement favorable pour mon héros.',
  5: 'Le matchup est très favorable pour mon héros.',
  6: 'Mon héros est un contre naturel de celui-ci.',
};

const matchupScoreHeadings: Record<HeroMatchupScore, string> = {
  0: '0 - Neutralise complètement mon héros',
  1: '1 - Très défavorable',
  2: '2 - Légèrement défavorable',
  3: '3 - Ni favorable ni défavorable',
  4: '4 - Légèrement favorable',
  5: '5 - Très favorable',
  6: '6 - Mon héros est un contre naturel',
};

const matchupScoreOrderByCategory: Record<MatchupCategory, HeroMatchupScore[]> =
  {
    avoid: [0, 1],
    neutral: [2, 3, 4],
    favorable: [6, 5],
  };

export function HeroDetail({ heroId }: { heroId: string }) {
  const {
    currentPlayer,
    heroes,
    heroPool,
    heroCategories,
    playerHeroCategories,
    heroEvaluations,
    heroMatchups,
    loadHeroEvaluation,
    loadLegacyHeroEvaluation,
    saveHeroEvaluation,
    listCompleteHeroEvaluations,
    updateHero,
    loadHeroMatchups,
    saveHeroMatchup,
    removeHeroMatchup,
    error,
  } = useAppState();
  const [metrics, setMetrics] = useState<HeroMetricMap>(
    createEmptyHeroMetricMap(),
  );
  const [evaluation, setEvaluation] = useState<PlayerHeroEvaluationV2 | null>(
    null,
  );
  const [legacyEvaluation, setLegacyEvaluation] =
    useState<LegacyPlayerHeroEvaluation | null>(null);
  const [comparison, setComparison] = useState<PlayerHeroEvaluationV2[]>([]);
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>(
    [],
  );
  const [matchups, setMatchups] = useState<PlayerHeroMatchup[]>([]);
  const [matchupQuery, setMatchupQuery] = useState('');
  const [matchupFilter, setMatchupFilter] =
    useState<MatchupCategoryFilter>('all');
  const [editingOpponentId, setEditingOpponentId] = useState<string | null>(
    null,
  );
  const [draftScores, setDraftScores] = useState<
    Record<string, HeroMatchupScore | null>
  >({});
  const [matchupSaveStates, setMatchupSaveStates] = useState<
    Record<string, MatchupSaveState>
  >({});
  const [matchupErrors, setMatchupErrors] = useState<Record<string, string>>(
    {},
  );
  const [timingStart, setTimingStart] = useState(20);
  const [timingEnd, setTimingEnd] = useState(25);
  const selectedComparisonIdsRef = useRef<string[]>([]);
  const [status, setStatus] = useState<SaveState>('idle');

  const hero = heroes.find((item) => item.id === heroId) ?? null;
  const playerHero = heroPool.find((item) => item.heroId === heroId) ?? null;
  const categoryNames = playerHeroCategories
    .filter((assignment) => assignment.heroId === heroId)
    .map(
      (assignment) =>
        heroCategories.find((category) => category.id === assignment.categoryId)
          ?.name,
    )
    .filter((name): name is string => Boolean(name));

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!currentPlayer || !playerHero) {
        return;
      }
      const loaded = await loadHeroEvaluation(heroId);
      const legacy = await loadLegacyHeroEvaluation(heroId);
      if (ignore) {
        return;
      }
      setEvaluation(loaded);
      setLegacyEvaluation(legacy);
      setMetrics(loaded?.metrics ?? createEmptyHeroMetricMap());
      setStatus(loaded ? 'saved' : 'idle');
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [
    currentPlayer,
    heroId,
    loadHeroEvaluation,
    loadLegacyHeroEvaluation,
    playerHero,
  ]);

  useEffect(() => {
    if (!playerHero) {
      return;
    }
    setTimingStart(playerHero.fightEntryStartMinute ?? 20);
    setTimingEnd(playerHero.fightEntryEndMinute ?? 25);
  }, [playerHero]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!currentPlayer || !playerHero) {
        return;
      }
      const loaded = await loadHeroMatchups(heroId);
      if (!ignore) {
        setMatchups(loaded);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [currentPlayer, heroId, loadHeroMatchups, playerHero, heroMatchups]);

  const progress = getHeroEvaluationProgress(evaluation);
  const ownSeries =
    evaluation && hero ? toRadarSeries(evaluation, hero.displayName) : null;

  const comparisonOptions = useMemo(
    () =>
      sortHeroesByDisplayName(
        heroEvaluations
          .filter((item) => item.heroId !== heroId)
          .filter(isCompleteHeroEvaluation)
          .map((item) => ({
            evaluation: item,
            hero: heroes.find((candidate) => candidate.id === item.heroId),
          }))
          .filter((item) => item.hero),
        (item) => item.hero,
      ),
    [heroEvaluations, heroId, heroes],
  );

  const heroesById = useMemo(
    () => new Map(heroes.map((candidate) => [candidate.id, candidate])),
    [heroes],
  );
  const matchupsByOpponent = useMemo(
    () =>
      new Map(
        matchups.map((matchup) => [matchup.opponentHeroId, matchup] as const),
      ),
    [matchups],
  );
  const matchupSummary = useMemo(
    () => ({
      avoid: sortMatchupCards(
        matchups.filter(
          (matchup) => getMatchupCategory(matchup.score) === 'avoid',
        ),
        heroesById,
        'avoid',
      ),
      favorable: sortMatchupCards(
        matchups.filter(
          (matchup) => getMatchupCategory(matchup.score) === 'favorable',
        ),
        heroesById,
        'favorable',
      ),
      neutral: sortMatchupCards(
        matchups.filter(
          (matchup) => getMatchupCategory(matchup.score) === 'neutral',
        ),
        heroesById,
        'neutral',
      ),
    }),
    [heroesById, matchups],
  );
  const matchupCounts = useMemo(
    () =>
      getHeroMatchupCatalogueCounts({
        heroes,
        currentHeroId: heroId,
        matchups,
      }),
    [heroes, heroId, matchups],
  );
  const catalogueOpponents = useMemo(
    () =>
      filterHeroMatchupCatalogue({
        heroes,
        currentHeroId: heroId,
        matchups,
        categoryFilter: matchupFilter,
        searchText: matchupQuery,
      }),
    [heroes, heroId, matchupFilter, matchupQuery, matchups],
  );

  async function handleSave() {
    setStatus('saving');
    const saved = await saveHeroEvaluation(heroId, metrics);
    setStatus(saved ? 'saved' : 'failed');
    if (saved) {
      const loaded = await loadHeroEvaluation(heroId);
      setEvaluation(loaded);
    }
  }

  async function handleSaveTiming() {
    if (!playerHero) {
      return;
    }
    setStatus('saving');
    const saved = await updateHero({
      ...playerHero,
      fightEntryStartMinute: timingStart,
      fightEntryEndMinute: timingEnd,
    });
    setStatus(saved ? 'saved' : 'failed');
  }

  async function handleClearTiming() {
    if (!playerHero) {
      return;
    }
    setStatus('saving');
    const saved = await updateHero({
      ...playerHero,
      fightEntryStartMinute: null,
      fightEntryEndMinute: null,
    });
    setStatus(saved ? 'saved' : 'failed');
  }

  function openMatchupEditor(opponentHeroId: string) {
    const existing = matchupsByOpponent.get(opponentHeroId);
    setEditingOpponentId(opponentHeroId);
    setDraftScores((current) => ({
      ...current,
      [opponentHeroId]: existing?.score ?? null,
    }));
    setMatchupSaveStates((current) => ({
      ...current,
      [opponentHeroId]: existing ? 'idle' : 'dirty',
    }));
    setMatchupErrors((current) => ({ ...current, [opponentHeroId]: '' }));
  }

  function handleDraftScoreChange(
    opponentHeroId: string,
    score: HeroMatchupScore,
  ) {
    setDraftScores((current) => ({ ...current, [opponentHeroId]: score }));
    setMatchupSaveStates((current) => ({
      ...current,
      [opponentHeroId]: 'dirty',
    }));
    setMatchupErrors((current) => ({ ...current, [opponentHeroId]: '' }));
  }

  async function handleSaveMatchup(opponentHeroId: string) {
    const draftScore = draftScores[opponentHeroId];
    if (draftScore === null || draftScore === undefined) {
      return;
    }
    setMatchupSaveStates((current) => ({
      ...current,
      [opponentHeroId]: 'saving',
    }));
    setMatchupErrors((current) => ({ ...current, [opponentHeroId]: '' }));
    setStatus('saving');
    const saved = await saveHeroMatchup(heroId, opponentHeroId, draftScore);
    setStatus(saved ? 'saved' : 'failed');
    if (saved) {
      setMatchups(await loadHeroMatchups(heroId));
      setMatchupSaveStates((current) => ({
        ...current,
        [opponentHeroId]: 'saved',
      }));
      setEditingOpponentId(opponentHeroId);
      return;
    }
    setMatchupSaveStates((current) => ({
      ...current,
      [opponentHeroId]: 'error',
    }));
    setMatchupErrors((current) => ({
      ...current,
      [opponentHeroId]: "Échec de l'enregistrement.",
    }));
  }

  async function handleRemoveMatchup(opponentHeroId: string) {
    setMatchupSaveStates((current) => ({
      ...current,
      [opponentHeroId]: 'saving',
    }));
    setMatchupErrors((current) => ({ ...current, [opponentHeroId]: '' }));
    setStatus('saving');
    const removed = await removeHeroMatchup(heroId, opponentHeroId);
    setStatus(removed ? 'saved' : 'failed');
    if (removed) {
      setMatchups(await loadHeroMatchups(heroId));
      setDraftScores((current) => ({ ...current, [opponentHeroId]: null }));
      setMatchupSaveStates((current) => ({
        ...current,
        [opponentHeroId]: 'saved',
      }));
      setEditingOpponentId(null);
      return;
    }
    setMatchupSaveStates((current) => ({
      ...current,
      [opponentHeroId]: 'error',
    }));
    setMatchupErrors((current) => ({
      ...current,
      [opponentHeroId]: "Échec de l'enregistrement.",
    }));
  }

  async function handleCompare() {
    if (!evaluation || !isCompleteHeroEvaluation(evaluation)) {
      return;
    }
    const complete = await listCompleteHeroEvaluations();
    const selectedIds = selectedComparisonIdsRef.current;
    setComparison([
      evaluation,
      ...complete.filter(
        (item) => item.heroId !== heroId && selectedIds.includes(item.heroId),
      ),
    ]);
  }

  function toggleComparisonHero(heroIdToToggle: string) {
    setSelectedComparisonIds((current) => {
      const next = current.includes(heroIdToToggle)
        ? current.filter((id) => id !== heroIdToToggle)
        : [...current, heroIdToToggle].slice(0, 2);
      selectedComparisonIdsRef.current = next;
      return next;
    });
  }

  if (!currentPlayer) {
    return (
      <section className="grid gap-4">
        <Link className="text-sm text-[var(--accent-hover)]" href="/player?tab=heroPool">
          Retour au Hero pool
        </Link>
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-secondary)]">
          Entre ton pseudo avant d&apos;ouvrir un détail de héros.
        </p>
      </section>
    );
  }

  if (!hero || !playerHero) {
    return (
      <section className="grid gap-4">
        <Link className="text-sm text-[var(--accent-hover)]" href="/player?tab=heroPool">
          Retour au Hero pool
        </Link>
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-secondary)]">
          Ce héros n&apos;est pas dans ton hero pool.
        </p>
      </section>
    );
  }

  const complete = evaluation ? isCompleteHeroEvaluation(evaluation) : false;

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6">
      <Link className="text-sm text-[var(--accent-hover)]" href="/player?tab=heroPool">
        Retour au Hero pool
      </Link>
      <header className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)] md:grid-cols-[16rem_1fr]">
        <HeroThumbnail hero={hero} size="full" className="rounded-md" />
        <div className="grid content-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {hero.displayName}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Profil personnel de ce héros pour ton jeu. Une grande surface de
              radar n&apos;est pas automatiquement meilleure.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--accent)] px-3 py-1 text-sm text-[var(--text-primary)]">
              {poolTierLabels[playerHero.poolTier]}
            </span>
            {categoryNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-secondary)]"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Profil complété : {progress.answered}/{progress.total}
          </p>
        </div>
      </header>

      {error ? (
        <p
          className="rounded-md border border-[rgb(239_120_109_/_0.5)] bg-[rgb(239_120_109_/_0.12)] p-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Timing de combat
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Dans une partie normale, entre quelles minutes souhaites-tu
              commencer a rejoindre activement les combats avec{' '}
              {hero.displayName} ?
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Choisis une fenêtre. La première borne indique le moment le plus tôt
            où tu souhaites commencer à te battre activement. La seconde indique
            le moment où le héros devrait normalement être prêt à rejoindre les
            combats.
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Timing de combat :{' '}
            {playerHero.fightEntryStartMinute === null ||
            playerHero.fightEntryEndMinute === null
              ? 'non renseigné'
              : formatMinuteRange(
                  playerHero.fightEntryStartMinute,
                  playerHero.fightEntryEndMinute,
                )}
          </p>
          <FightEntryWindowControl
            end={timingEnd}
            start={timingStart}
            onEndChange={setTimingEnd}
            onStartChange={setTimingStart}
          />
          <div className="flex flex-wrap gap-3">
            <button
              className="min-h-10 rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white"
              type="button"
              onClick={handleSaveTiming}
            >
              Enregistrer le timing
            </button>
            <button
              className="min-h-10 rounded-md border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-primary)]"
              type="button"
              onClick={handleClearTiming}
            >
              Effacer le timing
            </button>
          </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Évaluation personnelle
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Réponds selon ta manière de jouer {hero.displayName}, pas selon
              une valeur objective du héros.
            </p>
          </div>
          <SaveStatus state={status} />
        </div>

        {legacyEvaluation && !evaluation ? (
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
            Ce héros possède une ancienne évaluation. Les critères du profil ont
            évolué. Complète la nouvelle évaluation pour afficher le radar
            actuel et comparer ce héros.
          </p>
        ) : null}

        <div className="grid gap-4">
          {heroMetricIds.map((metricId) => (
            <MetricQuestion
              key={metricId}
              heroName={hero.displayName}
              metricId={metricId}
              value={metrics[metricId]}
              onChange={(value) =>
                setMetrics((current) => ({ ...current, [metricId]: value }))
              }
            />
          ))}
        </div>

        <div className="flex justify-end">
          <button
            className="min-h-11 rounded-md bg-[var(--accent)] px-5 py-2 font-semibold text-white"
            type="button"
            onClick={handleSave}
          >
            Enregistrer l&apos;évaluation
          </button>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Profil radar
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Ce radar décrit ta perception et ton utilisation du héros. Une valeur
          élevée représente une caractéristique marquée, pas nécessairement une
          meilleure qualité. Une forte dépendance au farm indique un besoin
          important de ressources.
        </p>
        <ul className="grid gap-1 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
          <li>Chasseur : Initiation, Mobilité, Dégâts aux héros</li>
          <li>
            Core / Pusher : Dégâts aux héros, Dépendance au farm, Dégâts aux
            bâtiments
          </li>
          <li>Support / Facilitateur : Enabler, Save, Contrôle</li>
          <li>Teamfight / Engagement : Contrôle, Teamfight, Initiation</li>
        </ul>
        {ownSeries && complete ? (
          <RadarChart series={[ownSeries]} />
        ) : (
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
            Le radar complet apparaîtra quand les neuf métriques auront une
            réponse. Les valeurs manquantes ne sont pas dessinées comme zéro.
          </p>
        )}
        <MetricValueTable
          evaluations={evaluation ? [evaluation] : []}
          heroes={heroes}
        />
      </section>
      <section className="grid gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)]">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Matchups
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Ces scores représentent ta perception du matchup depuis{' '}
            {hero.displayName}. Le sens inverse n&apos;est pas créé
            automatiquement.
          </p>
        </div>
        <MatchupSummarySection
          group="avoid"
          heroesById={heroesById}
          matchups={matchupSummary.avoid}
          title="Matchups à éviter ou à envisager de bannir"
          onEdit={openMatchupEditor}
          onRemove={handleRemoveMatchup}
        />
        <MatchupSummarySection
          group="neutral"
          heroesById={heroesById}
          matchups={matchupSummary.neutral}
          title="Matchups neutres"
          onEdit={openMatchupEditor}
          onRemove={handleRemoveMatchup}
        />
        <MatchupSummarySection
          group="favorable"
          heroesById={heroesById}
          matchups={matchupSummary.favorable}
          title="Matchups favorables"
          onEdit={openMatchupEditor}
          onRemove={handleRemoveMatchup}
        />
        <div className="grid gap-3 border-t border-[var(--border)] pt-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Catalogue des matchups
          </h3>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
              Rechercher un héros adverse
              <input
                className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--text-primary)]"
                value={matchupQuery}
                onChange={(event) => setMatchupQuery(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
              Filtre
              <select
                className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--text-primary)]"
                value={matchupFilter}
                onChange={(event) =>
                  setMatchupFilter(event.target.value as MatchupCategoryFilter)
                }
              >
                <option value="all">Tous ({matchupCounts.all})</option>
                <option value="avoid">À éviter ({matchupCounts.avoid})</option>
                <option value="neutral">
                  Neutres ({matchupCounts.neutral})
                </option>
                <option value="favorable">
                  Favorables ({matchupCounts.favorable})
                </option>
                <option value="unrated">
                  Non évalués ({matchupCounts.unrated})
                </option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalogueOpponents.map((item) => {
              const persistedScore = item.matchup?.score ?? null;
              const draftScore =
                draftScores[item.hero.id] !== undefined
                  ? draftScores[item.hero.id]
                  : persistedScore;
              const saveState = matchupSaveStates[item.hero.id] ?? 'idle';
              return (
                <MatchupCatalogueCard
                  key={item.hero.id}
                  draftScore={draftScore}
                  editing={editingOpponentId === item.hero.id}
                  errorMessage={matchupErrors[item.hero.id] ?? ''}
                  hero={item.hero}
                  matchup={item.matchup}
                  persistedScore={persistedScore}
                  saveState={saveState}
                  onCancel={() => {
                    setEditingOpponentId(null);
                  }}
                  onDraftScoreChange={(score) =>
                    handleDraftScoreChange(item.hero.id, score)
                  }
                  onEdit={() => openMatchupEditor(item.hero.id)}
                  onRemove={() => handleRemoveMatchup(item.hero.id)}
                  onSave={() => handleSaveMatchup(item.hero.id)}
                />
              );
            })}
          </div>
        </div>
      </section>
      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Comparer
        </h2>
        {!complete ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Termine l&apos;évaluation de {hero.displayName} pour comparer ce
            héros.
          </p>
        ) : (
          <>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-semibold text-[var(--text-primary)]">
                Choisis un ou deux autres héros évalués
              </legend>
              {comparisonOptions.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Aucun autre héros avec une évaluation complète.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {comparisonOptions.map(
                    ({ evaluation: item, hero: optionHero }) => (
                      <label
                        key={item.heroId}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      >
                        <input
                          checked={selectedComparisonIds.includes(item.heroId)}
                          className="h-4 w-4 accent-[var(--accent)]"
                          disabled={
                            selectedComparisonIds.length >= 2 &&
                            !selectedComparisonIds.includes(item.heroId)
                          }
                          type="checkbox"
                          onChange={() => toggleComparisonHero(item.heroId)}
                        />
                        {optionHero?.displayName}
                      </label>
                    ),
                  )}
                </div>
              )}
            </fieldset>
            <button
              className="w-fit min-h-10 rounded-md border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-primary)]"
              type="button"
              onClick={handleCompare}
            >
              Comparer
            </button>
            {comparison.length > 1 ? (
              <>
                <RadarChart
                  series={comparison
                    .map((item) =>
                      toRadarSeries(
                        item,
                        heroes.find((candidate) => candidate.id === item.heroId)
                          ?.displayName ?? item.heroId,
                      ),
                    )
                    .filter((item): item is RadarSeries => Boolean(item))}
                />
                <MetricValueTable evaluations={comparison} heroes={heroes} />
              </>
            ) : null}
          </>
        )}
      </section>
    </section>
  );
}

function MetricQuestion({
  heroName,
  metricId,
  value,
  onChange,
}: {
  heroName: string;
  metricId: HeroMetricId;
  value: HeroMetricScore | null;
  onChange: (value: HeroMetricScore) => void;
}) {
  const copy = heroMetricCopy[metricId];
  const labelForValue = (score: number) => {
    if (score === 0) {
      return zeroMetricLabels[metricId];
    }
    if (score === 1) {
      return copy.low;
    }
    if (score === 3) {
      return copy.mid;
    }
    if (score === 5) {
      return copy.high;
    }
    return '';
  };

  return (
    <fieldset className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <legend className="text-base font-semibold text-[var(--text-primary)]">
        {copy.makeQuestion(heroName)}
      </legend>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{copy.helper}</p>{' '}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((score) => (
          <label
            key={score}
            className={`grid min-h-16 cursor-pointer place-items-center rounded-md border px-2 py-2 text-center text-sm ${
              value === score
                ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
                : 'border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            <input
              checked={value === score}
              className="sr-only"
              name={metricId}
              type="radio"
              value={score}
              onChange={() => onChange(score as HeroMetricScore)}
            />
            <span className="font-semibold">{score}</span>
            {labelForValue(score) ? (
              <span className="text-xs">{labelForValue(score)}</span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FightEntryWindowControl({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start: number;
  end: number;
  onStartChange: (value: number) => void;
  onEndChange: (value: number) => void;
}) {
  const marks = [0, 10, 20, 30, 40, 50, 60];
  return (
    <div className="grid gap-4">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Fenêtre choisie : {formatMinuteRange(start, end)}
      </p>
      <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
        Début le plus tôt : {formatMinute(start)}
        <input
          max={60}
          min={0}
          type="range"
          value={start}
          onChange={(event) =>
            onStartChange(Math.min(Number(event.target.value), end))
          }
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
        Pret normalement : {formatMinute(end)}
        <input
          max={60}
          min={0}
          type="range"
          value={end}
          onChange={(event) =>
            onEndChange(Math.max(Number(event.target.value), start))
          }
        />
      </label>
      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
        {marks.map((mark) => (
          <span key={mark}>{formatMinute(mark)}</span>
        ))}
      </div>
    </div>
  );
}

function MatchupSummarySection({
  title,
  group,
  matchups,
  heroesById,
  onEdit,
  onRemove,
}: {
  title: string;
  group: MatchupCategory;
  matchups: PlayerHeroMatchup[];
  heroesById: Map<string, Hero>;
  onEdit: (opponentHeroId: string) => void;
  onRemove: (opponentHeroId: string) => void;
}) {
  const matchupsByScore = new Map<HeroMatchupScore, PlayerHeroMatchup[]>();
  for (const matchup of matchups) {
    const current = matchupsByScore.get(matchup.score) ?? [];
    matchupsByScore.set(matchup.score, [...current, matchup]);
  }

  return (
    <section className="grid gap-3">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      {matchups.length === 0 ? (
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-secondary)]">
          Aucun matchup dans ce groupe.
        </p>
      ) : (
        <div className="grid gap-4">
          {matchupScoreOrderByCategory[group].map((score) => {
            const scoreMatchups = matchupsByScore.get(score) ?? [];
            if (scoreMatchups.length === 0) {
              return null;
            }
            return (
              <section key={`${group}-${score}`} className="grid gap-2">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  {matchupScoreHeadings[score]}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {sortMatchupCards(scoreMatchups, heroesById, group).map(
                    (matchup) => {
                      const hero = heroesById.get(matchup.opponentHeroId);
                      return (
                        <article
                          key={`${group}-${matchup.opponentHeroId}`}
                          className="grid gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3"
                        >
                          <p className="font-semibold text-[var(--text-primary)]">
                            {hero?.displayName ?? matchup.opponentHeroId}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {matchup.score}/6 -{' '}
                            {matchupScoreLabels[matchup.score]}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="min-h-9 rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]"
                              type="button"
                              onClick={() => onEdit(matchup.opponentHeroId)}
                            >
                              Modifier
                            </button>
                            <button
                              className="min-h-9 rounded-md border border-[rgb(239_120_109_/_0.45)] px-3 py-1 text-sm text-[var(--danger)]"
                              type="button"
                              onClick={() => onRemove(matchup.opponentHeroId)}
                            >
                              Retirer
                            </button>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MatchupCatalogueCard({
  hero,
  matchup,
  editing,
  draftScore,
  persistedScore,
  saveState,
  errorMessage,
  onEdit,
  onDraftScoreChange,
  onSave,
  onCancel,
  onRemove,
}: {
  hero: Hero;
  matchup: PlayerHeroMatchup | null;
  editing: boolean;
  draftScore: HeroMatchupScore | null;
  persistedScore: HeroMatchupScore | null;
  saveState: MatchupSaveState;
  errorMessage: string;
  onEdit: () => void;
  onDraftScoreChange: (score: HeroMatchupScore) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const dirty = draftScore !== persistedScore;
  const resolvedSaveState = saveState === 'idle' && dirty ? 'dirty' : saveState;
  const saving = resolvedSaveState === 'saving';
  const saveLabel = getMatchupSaveButtonLabel(resolvedSaveState, matchup);
  const statusText = getMatchupStatusText(resolvedSaveState, matchup);

  return (
    <article className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <div className="flex gap-3">
        <HeroThumbnail hero={hero} size="small" className="rounded" />
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-[var(--text-primary)]">
            {hero.displayName}
          </h4>
          <p className="text-sm text-[var(--text-secondary)]">
            {matchup
              ? `${matchup.score}/6 - ${matchupScoreLabels[matchup.score]}`
              : 'Non évalué'}
          </p>
        </div>
      </div>
      <p
        className="text-sm font-medium text-[var(--text-primary)]"
        aria-live="polite"
      >
        {statusText}
      </p>
      {errorMessage ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {editing ? (
        <div className="grid gap-3">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Score de matchup</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {heroMatchupScores.map((score) => (
                <label
                  key={score}
                  className={`grid min-h-14 cursor-pointer place-items-center rounded-md border px-2 py-1 text-center text-sm ${
                    draftScore === score
                      ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  <input
                    checked={draftScore === score}
                    className="sr-only"
                    name={`matchup-${hero.id}`}
                    type="radio"
                    onChange={() => onDraftScoreChange(score)}
                  />
                  {score}/6
                </label>
              ))}
            </div>
          </fieldset>
          {draftScore !== null ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {matchupScoreLabels[draftScore]}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-9 rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
              disabled={draftScore === null || saving || !dirty}
              type="button"
              onClick={onSave}
            >
              {saveLabel}
            </button>
            <button
              className="min-h-9 rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]"
              disabled={saving}
              type="button"
              onClick={onCancel}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-9 rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]"
            type="button"
            onClick={onEdit}
          >
            {matchup ? 'Modifier' : 'Évaluer'}
          </button>
          {matchup ? (
            <button
              className="min-h-9 rounded-md border border-[rgb(239_120_109_/_0.45)] px-3 py-1 text-sm text-[var(--danger)]"
              disabled={saving}
              type="button"
              onClick={onRemove}
            >
              {saving ? 'Suppression...' : 'Retirer'}
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}

function getMatchupSaveButtonLabel(
  state: MatchupSaveState,
  matchup: PlayerHeroMatchup | null,
): string {
  if (state === 'saving') {
    return 'Enregistrement...';
  }
  if (state === 'saved') {
    return matchup ? 'Enregistré ✓' : 'Enregistrer';
  }
  if (state === 'error') {
    return "Échec de l'enregistrement";
  }
  if (state === 'dirty') {
    return 'Enregistrer';
  }
  return matchup ? 'Enregistré' : 'Enregistrer';
}

function getMatchupStatusText(
  state: MatchupSaveState,
  matchup: PlayerHeroMatchup | null,
): string {
  if (state === 'saving') {
    return 'Enregistrement en cours...';
  }
  if (state === 'saved') {
    return matchup ? 'Enregistré ✓' : 'Évaluation retirée ✓';
  }
  if (state === 'error') {
    return "Échec de l'enregistrement";
  }
  if (state === 'dirty') {
    return 'Modification non enregistrée';
  }
  return matchup ? 'Enregistré' : 'Non évalué';
}

function RadarChart({ series }: { series: RadarSeries[] }) {
  const size = 320;
  const center = size / 2;
  const maxRadius = 118;
  const axisCount = heroMetricIds.length;
  const palette = ['#f07f68', '#e9c46a', '#6ec6d9'];

  function pointFor(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
    const radius = (value / 5) * maxRadius;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  }

  function axisPoint(index: number) {
    const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * maxRadius,
      y: center + Math.sin(angle) * maxRadius,
    };
  }

  return (
    <div>
      <svg
        aria-label={`Radar personnel comparant ${series
          .map((item) => item.heroName)
          .join(', ')}`}
        className="h-auto w-full max-w-[420px]"
        role="img"
        viewBox={`0 0 ${size} ${size}`}
      >
        {[1, 2, 3, 4, 5].map((level) => {
          const points = heroMetricIds
            .map((_, index) => pointFor(index, level))
            .map((point) => `${point.x},${point.y}`)
            .join(' ');
          return (
            <polygon
              key={level}
              fill="none"
              points={points}
              stroke="rgba(255,255,255,0.12)"
            />
          );
        })}
        {heroMetricIds.map((metricId, index) => {
          const point = axisPoint(index);
          return (
            <g key={metricId}>
              <line
                stroke="rgba(255,255,255,0.16)"
                x1={center}
                x2={point.x}
                y1={center}
                y2={point.y}
              />
              <text
                fill="rgba(245,239,231,0.86)"
                fontSize="10"
                textAnchor="middle"
                x={center + (point.x - center) * 1.16}
                y={center + (point.y - center) * 1.16}
              >
                {heroMetricCopy[metricId].label}
              </text>
            </g>
          );
        })}
        {series.map((item, seriesIndex) => {
          const color = palette[seriesIndex % palette.length];
          const points = item.points
            .map((point, index) => pointFor(index, point.value))
            .map((point) => `${point.x},${point.y}`)
            .join(' ');
          return (
            <g key={item.heroId}>
              <polygon
                fill={seriesIndex === 0 ? `${color}44` : 'transparent'}
                points={points}
                stroke={color}
                strokeDasharray={seriesIndex === 1 ? '5 4' : undefined}
                strokeWidth="2"
              />
              {item.points.map((point, index) => {
                const position = pointFor(index, point.value);
                return (
                  <circle
                    key={point.metricId}
                    cx={position.x}
                    cy={position.y}
                    fill={color}
                    r={3}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
        {series.map((item, index) => (
          <span key={item.heroId}>
            Série {index + 1}: {item.heroName}
          </span>
        ))}
      </div>
    </div>
  );
}

function MetricValueTable({
  evaluations,
  heroes,
}: {
  evaluations: PlayerHeroEvaluationV2[];
  heroes: { id: string; displayName: string }[];
}) {
  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-primary)]">
            <th className="py-2 pr-3">Métrique</th>
            {evaluations.map((evaluation) => (
              <th key={evaluation.heroId} className="px-3 py-2">
                {heroes.find((hero) => hero.id === evaluation.heroId)
                  ?.displayName ?? evaluation.heroId}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heroMetricIds.map((metricId) => (
            <tr key={metricId} className="border-b border-[var(--border)]">
              <th className="py-2 pr-3 font-medium text-[var(--text-primary)]">
                {heroMetricCopy[metricId].label}
              </th>
              {evaluations.map((evaluation) => (
                <td
                  key={`${evaluation.heroId}-${metricId}`}
                  className="px-3 py-2 text-[var(--text-secondary)]"
                >
                  {evaluation.metrics[metricId] ?? 'Non répondu'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sortMatchupCards(
  matchups: PlayerHeroMatchup[],
  heroesById: Map<string, Hero>,
  group: MatchupCategory,
): PlayerHeroMatchup[] {
  return [...matchups].sort((left, right) => {
    if (group === 'avoid' && left.score !== right.score) {
      return left.score - right.score;
    }
    if (group === 'favorable' && left.score !== right.score) {
      return right.score - left.score;
    }
    return (
      heroesById
        .get(left.opponentHeroId)
        ?.displayName.localeCompare(
          heroesById.get(right.opponentHeroId)?.displayName ??
            right.opponentHeroId,
          'fr',
          { sensitivity: 'base', numeric: true },
        ) ?? left.opponentHeroId.localeCompare(right.opponentHeroId)
    );
  });
}

function formatMinuteRange(start: number, end: number): string {
  return `${formatMinute(start)}-${formatMinute(end)}`;
}

function formatMinute(value: number): string {
  return value === 60 ? '60 min ou plus' : `${value} min`;
}
