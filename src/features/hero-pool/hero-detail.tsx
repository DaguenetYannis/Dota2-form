'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { HeroThumbnail } from '@/components/hero-thumbnail';
import { SaveStatus, type SaveState } from '@/components/save-status';
import type { Hero } from '@/domain/entities/hero';
import { isCorePlayerHero } from '@/domain/entities/player-hero';
import {
  getHeroMatchupGroup,
  heroMatchupScores,
  type HeroMatchupGroup,
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

type MatchupFilter = 'all' | 'avoid' | 'neutral' | 'favorable' | 'unrated';

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
  2: 'Le matchup est plutôt défavorable pour mon héros.',
  3: "Le matchup n'est ni favorable ni défavorable.",
  4: 'Le matchup est plutôt favorable pour mon héros.',
  5: 'Le matchup est très favorable pour mon héros.',
  6: 'Mon héros est un contre naturel de celui-ci.',
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
  const [matchupFilter, setMatchupFilter] = useState<MatchupFilter>('all');
  const [editingOpponentId, setEditingOpponentId] = useState<string | null>(
    null,
  );
  const [pendingMatchupScore, setPendingMatchupScore] =
    useState<HeroMatchupScore | null>(null);
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
  const sortedOpponentHeroes = useMemo(
    () =>
      sortHeroesByDisplayName(
        heroes.filter((candidate) => candidate.id !== heroId),
        (candidate) => candidate,
      ),
    [heroes, heroId],
  );
  const matchupSummary = useMemo(
    () => ({
      avoid: sortMatchupCards(
        matchups.filter(
          (matchup) => getHeroMatchupGroup(matchup.score) === 'avoid',
        ),
        heroesById,
        'avoid',
      ),
      favorable: sortMatchupCards(
        matchups.filter(
          (matchup) => getHeroMatchupGroup(matchup.score) === 'favorable',
        ),
        heroesById,
        'favorable',
      ),
      neutral: sortMatchupCards(
        matchups.filter(
          (matchup) => getHeroMatchupGroup(matchup.score) === 'neutral',
        ),
        heroesById,
        'neutral',
      ),
    }),
    [heroesById, matchups],
  );
  const catalogueOpponents = useMemo(() => {
    const normalized = normalizeMatchupSearch(matchupQuery);
    return sortedOpponentHeroes.filter((opponent) => {
      const matchup = matchupsByOpponent.get(opponent.id);
      const group = matchup ? getHeroMatchupGroup(matchup.score) : 'unrated';
      if (
        normalized &&
        !normalizeMatchupSearch(opponent.displayName).includes(normalized)
      ) {
        return false;
      }
      return matchupFilter === 'all' ? true : group === matchupFilter;
    });
  }, [matchupFilter, matchupQuery, matchupsByOpponent, sortedOpponentHeroes]);

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
    setPendingMatchupScore(existing?.score ?? null);
  }

  async function handleSaveMatchup() {
    if (!editingOpponentId || pendingMatchupScore === null) {
      return;
    }
    setStatus('saving');
    const saved = await saveHeroMatchup(
      heroId,
      editingOpponentId,
      pendingMatchupScore,
    );
    setStatus(saved ? 'saved' : 'failed');
    if (saved) {
      setMatchups(await loadHeroMatchups(heroId));
      setEditingOpponentId(null);
      setPendingMatchupScore(null);
    }
  }

  async function handleRemoveMatchup(opponentHeroId: string) {
    setStatus('saving');
    const removed = await removeHeroMatchup(heroId, opponentHeroId);
    setStatus(removed ? 'saved' : 'failed');
    if (removed) {
      setMatchups(await loadHeroMatchups(heroId));
      setEditingOpponentId(null);
      setPendingMatchupScore(null);
    }
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
        <Link className="text-sm text-[var(--accent-hover)]" href="/player">
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
        <Link className="text-sm text-[var(--accent-hover)]" href="/player">
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
      <Link className="text-sm text-[var(--accent-hover)]" href="/player">
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

      {isCorePlayerHero(playerHero) ? (
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
      ) : null}

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
            Ce hÃ©ros possÃ¨de une ancienne Ã©valuation. Les critÃ¨res du profil
            ont Ã©voluÃ©. ComplÃ¨te la nouvelle Ã©valuation pour afficher le
            radar actuel et comparer ce hÃ©ros.
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
          Ce radar decrit ta perception et ton utilisation du heros. Une valeur
          elevee represente une caracteristique marquee, pas necessairement une
          meilleure qualite. Une forte dependance au farm indique un besoin
          important de ressources.
        </p>
        <ul className="grid gap-1 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
          <li>Chasseur : Initiation, Mobilite, Degats aux heros</li>
          <li>
            Core / Pusher : Degats aux heros, Dependance au farm, Degats aux
            batiments
          </li>
          <li>Support / Facilitateur : Enabler, Save, Controle</li>
          <li>Teamfight / Engagement : Controle, Teamfight, Initiation</li>
        </ul>
        {ownSeries && complete ? (
          <RadarChart series={[ownSeries]} />
        ) : (
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
            Le radar complet apparaitra quand les neuf metriques auront une
            reponse. Les valeurs manquantes ne sont pas dessinees comme zero.
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
          group="favorable"
          heroesById={heroesById}
          matchups={matchupSummary.favorable}
          title="Matchups favorables"
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
                  setMatchupFilter(event.target.value as MatchupFilter)
                }
              >
                <option value="all">Tous</option>
                <option value="avoid">À éviter</option>
                <option value="neutral">Neutres</option>
                <option value="favorable">Favorables</option>
                <option value="unrated">Non évalués</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalogueOpponents.map((opponent) => {
              const matchup = matchupsByOpponent.get(opponent.id);
              return (
                <MatchupCatalogueCard
                  key={opponent.id}
                  editing={editingOpponentId === opponent.id}
                  hero={opponent}
                  matchup={matchup ?? null}
                  pendingScore={pendingMatchupScore}
                  onCancel={() => {
                    setEditingOpponentId(null);
                    setPendingMatchupScore(null);
                  }}
                  onEdit={() => openMatchupEditor(opponent.id)}
                  onPendingScoreChange={setPendingMatchupScore}
                  onRemove={() => handleRemoveMatchup(opponent.id)}
                  onSave={handleSaveMatchup}
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
        Fenetre choisie : {formatMinuteRange(start, end)}
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
  group: HeroMatchupGroup;
  matchups: PlayerHeroMatchup[];
  heroesById: Map<string, { id: string; displayName: string }>;
  onEdit: (opponentHeroId: string) => void;
  onRemove: (opponentHeroId: string) => void;
}) {
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matchups.map((matchup) => {
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
                  {matchup.score}/6 - {matchupScoreLabels[matchup.score]}
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
  pendingScore,
  onEdit,
  onPendingScoreChange,
  onSave,
  onCancel,
  onRemove,
}: {
  hero: Hero;
  matchup: PlayerHeroMatchup | null;
  editing: boolean;
  pendingScore: HeroMatchupScore | null;
  onEdit: () => void;
  onPendingScoreChange: (score: HeroMatchupScore) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
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
      {editing ? (
        <div className="grid gap-3">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Score de matchup</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {heroMatchupScores.map((score) => (
                <label
                  key={score}
                  className={`grid min-h-14 cursor-pointer place-items-center rounded-md border px-2 py-1 text-center text-sm ${
                    pendingScore === score
                      ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  <input
                    checked={pendingScore === score}
                    className="sr-only"
                    name={`matchup-${hero.id}`}
                    type="radio"
                    onChange={() => onPendingScoreChange(score)}
                  />
                  {score}/6
                </label>
              ))}
            </div>
          </fieldset>
          {pendingScore !== null ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {matchupScoreLabels[pendingScore]}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-9 rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
              disabled={pendingScore === null}
              type="button"
              onClick={onSave}
            >
              Enregistrer
            </button>
            <button
              className="min-h-9 rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]"
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
              type="button"
              onClick={onRemove}
            >
              Retirer
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
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
  group: HeroMatchupGroup,
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

function normalizeMatchupSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase();
}

function formatMinuteRange(start: number, end: number): string {
  return `${formatMinute(start)}-${formatMinute(end)}`;
}

function formatMinute(value: number): string {
  return value === 60 ? '60 min ou plus' : `${value} min`;
}
