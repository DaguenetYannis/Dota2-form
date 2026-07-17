'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { HeroThumbnail } from '@/components/hero-thumbnail';
import { SaveStatus, type SaveState } from '@/components/save-status';
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

export function HeroDetail({ heroId }: { heroId: string }) {
  const {
    currentPlayer,
    heroes,
    heroPool,
    heroCategories,
    playerHeroCategories,
    heroEvaluations,
    loadHeroEvaluation,
    loadLegacyHeroEvaluation,
    saveHeroEvaluation,
    listCompleteHeroEvaluations,
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

  const progress = getHeroEvaluationProgress(evaluation);
  const ownSeries =
    evaluation && hero ? toRadarSeries(evaluation, hero.displayName) : null;

  const comparisonOptions = useMemo(
    () =>
      heroEvaluations
        .filter((item) => item.heroId !== heroId)
        .filter(isCompleteHeroEvaluation)
        .map((item) => ({
          evaluation: item,
          hero: heroes.find((candidate) => candidate.id === item.heroId),
        }))
        .filter((item) => item.hero),
    [heroEvaluations, heroId, heroes],
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
      <div className="mt-4 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
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
