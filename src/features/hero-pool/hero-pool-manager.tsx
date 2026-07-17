'use client';

import { useMemo, useState } from 'react';
import { MultiCheckbox } from '@/components/form/multi-checkbox';
import { RatingSelect } from '@/components/form/rating-select';
import type { PlayerHero } from '@/domain/entities/player-hero';
import {
  draftPhaseIds,
  individualPlaystyleIds,
  poolTierIds,
  roleIds,
  type DraftPhaseId,
  type IndividualPlaystyleId,
  type PoolTierId,
  type RoleId,
} from '@/domain/value-objects/vocabularies';
import { useAppState } from '@/lib/app-state';
import {
  draftPhaseLabels,
  individualPlaystyleLabels,
  poolTierLabels,
  roleLabels,
} from '@/lib/labels';

const roleOptions = roleIds.map((value) => ({
  value,
  label: roleLabels[value],
}));
const playstyleOptions = individualPlaystyleIds.map((value) => ({
  value,
  label: individualPlaystyleLabels[value],
}));

export function HeroPoolManager() {
  const {
    currentPlayer,
    heroes,
    heroPool,
    addHero,
    updateHero,
    removeHero,
    error,
  } = useAppState();
  const [query, setQuery] = useState('');
  const [heroId, setHeroId] = useState(heroes[0]?.id ?? '');
  const [poolTier, setPoolTier] = useState<PoolTierId>('comfortable');
  const [roles, setRoles] = useState<RoleId[]>(['position_1']);

  const filteredHeroes = useMemo(
    () =>
      heroes.filter((hero) =>
        hero.displayName
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
      ),
    [heroes, query],
  );

  async function handleAdd() {
    if (!currentPlayer || !heroId) {
      return;
    }

    await addHero({
      playerId: currentPlayer.id,
      heroId,
      roles,
      poolTier,
      comfort: 3,
      confidence: 3,
      recentExperience: 3,
      blindPickConfidence: 3,
      flexPick: false,
      preferredDraftPhase: 'flexible',
      preferredPlaystyles: [],
      requiredAlliedFeatures: [],
      personalNotes: '',
    });
  }

  if (!currentPlayer) {
    return (
      <section className="grid gap-3">
        <h1 className="text-2xl font-bold text-slate-950">Hero pool</h1>
        <p className="rounded-md border border-slate-200 bg-white p-4 text-slate-700">
          Creez d&apos;abord un profil joueur avant d&apos;ajouter des heros.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Hero pool</h1>
        <p className="text-slate-700">
          Ajoutez les heros du joueur puis ajustez les evaluations
          individuelles.
        </p>
      </div>
      <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <label
          className="grid gap-2 text-sm font-medium text-slate-800"
          htmlFor="heroSearch"
        >
          Rechercher un heros
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            id="heroSearch"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label
            className="grid gap-2 text-sm font-medium text-slate-800"
            htmlFor="heroSelector"
          >
            Heros
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
              id="heroSelector"
              value={heroId}
              onChange={(event) => setHeroId(event.target.value)}
            >
              {filteredHeroes.map((hero) => (
                <option key={hero.id} value={hero.id}>
                  {hero.displayName}
                </option>
              ))}
            </select>
          </label>
          <label
            className="grid gap-2 text-sm font-medium text-slate-800"
            htmlFor="poolTier"
          >
            Tier de pool
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
              id="poolTier"
              value={poolTier}
              onChange={(event) =>
                setPoolTier(event.target.value as PoolTierId)
              }
            >
              {poolTierIds.map((tier) => (
                <option key={tier} value={tier}>
                  {poolTierLabels[tier]}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-1">
            <MultiCheckbox
              legend="Roles"
              options={roleOptions}
              value={roles}
              onChange={setRoles}
            />
          </div>
        </div>
        {error ? (
          <p
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          className="w-fit rounded-md bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800"
          type="button"
          onClick={handleAdd}
        >
          Ajouter le heros
        </button>
      </div>
      <div className="grid gap-4">
        {heroPool.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white p-4 text-slate-700">
            Aucun heros dans le pool pour le moment.
          </p>
        ) : (
          heroPool.map((playerHero) => (
            <HeroPoolCard
              key={playerHero.id}
              playerHero={playerHero}
              heroName={
                heroes.find((hero) => hero.id === playerHero.heroId)
                  ?.displayName ?? playerHero.heroId
              }
              onChange={updateHero}
              onRemove={removeHero}
            />
          ))
        )}
      </div>
    </section>
  );
}

function HeroPoolCard({
  playerHero,
  heroName,
  onChange,
  onRemove,
}: {
  playerHero: PlayerHero;
  heroName: string;
  onChange: (playerHero: PlayerHero) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(playerHero);

  function update(next: Partial<PlayerHero>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function save() {
    await onChange(draft);
  }

  return (
    <article className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">{heroName}</h2>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="button"
            onClick={save}
          >
            Modifier
          </button>
          <button
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
            type="button"
            onClick={() => onRemove(playerHero.id)}
          >
            Retirer
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Tier de pool
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            value={draft.poolTier}
            onChange={(event) =>
              update({ poolTier: event.target.value as PoolTierId })
            }
          >
            {poolTierIds.map((tier) => (
              <option key={tier} value={tier}>
                {poolTierLabels[tier]}
              </option>
            ))}
          </select>
        </label>
        <RatingSelect
          id={`${draft.id}-comfort`}
          label="Confort joueur"
          min={0}
          value={draft.comfort}
          onChange={(value) => update({ comfort: value })}
        />
        <RatingSelect
          id={`${draft.id}-confidence`}
          label="Confiance"
          min={0}
          value={draft.confidence}
          onChange={(value) => update({ confidence: value })}
        />
        <RatingSelect
          id={`${draft.id}-blind`}
          label="Blind pick"
          min={0}
          value={draft.blindPickConfidence}
          onChange={(value) => update({ blindPickConfidence: value })}
        />
        <RatingSelect
          id={`${draft.id}-recent`}
          label="Experience recente"
          min={0}
          value={draft.recentExperience}
          onChange={(value) => update({ recentExperience: value })}
        />
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Phase de draft
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            value={draft.preferredDraftPhase}
            onChange={(event) =>
              update({
                preferredDraftPhase: event.target.value as DraftPhaseId,
              })
            }
          >
            {draftPhaseIds.map((phase) => (
              <option key={phase} value={phase}>
                {draftPhaseLabels[phase]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-800">
          <input
            checked={draft.flexPick}
            type="checkbox"
            onChange={(event) => update({ flexPick: event.target.checked })}
          />
          Flex pick
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MultiCheckbox
          legend="Roles joues"
          options={roleOptions}
          value={draft.roles}
          onChange={(value) => update({ roles: value })}
        />
        <MultiCheckbox
          legend="Styles preferes sur ce heros"
          options={playstyleOptions}
          value={draft.preferredPlaystyles}
          onChange={(value) => update({ preferredPlaystyles: value })}
        />
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Besoins allies
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          value={draft.requiredAlliedFeatures.join(', ')}
          onChange={(event) =>
            update({
              requiredAlliedFeatures: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Notes personnelles
        <textarea
          className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
          value={draft.personalNotes}
          onChange={(event) => update({ personalNotes: event.target.value })}
        />
      </label>
    </article>
  );
}
