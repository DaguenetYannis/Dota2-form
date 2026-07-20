'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { HeroPoolManager } from '@/features/hero-pool/hero-pool-manager';
import { ProfileForm } from '@/features/player-profile/profile-form';
import { PseudoEntry } from './pseudo-entry';
import { useAppState } from '@/lib/app-state';

type PlayerTab = 'profile' | 'heroPool';

export function PlayerSpace() {
  const { currentPlayer, updateSteamId, updateTeamId, error } = useAppState();
  const [activeTab, setActiveTab] = useState<PlayerTab>('profile');

  if (!currentPlayer) {
    return <PseudoEntry />;
  }

  return (
    <section className="grid gap-6">
      <header className="grid gap-5 rounded-lg border border-[var(--border)] bg-[rgb(18_24_36_/_0.86)] p-4 shadow-[var(--shadow-panel)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-hover)]">
            Dota Profiles
          </p>
          <PlayerIdentityBadge
            error={error}
            pseudonym={currentPlayer.pseudonym}
            steamId={currentPlayer.steamId}
            teamId={currentPlayer.teamId}
            onSaveSteamId={updateSteamId}
            onSaveTeamId={updateTeamId}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Ton espace
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Configure ton profil et ton hero pool.
          </p>
        </div>
        <div
          aria-label="Sections joueur"
          className="inline-flex w-fit rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-1"
          role="tablist"
        >
          <button
            aria-controls="profile-panel"
            aria-selected={activeTab === 'profile'}
            className={`min-h-10 rounded px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            id="profile-tab"
            onClick={() => setActiveTab('profile')}
            role="tab"
            tabIndex={activeTab === 'profile' ? 0 : -1}
            type="button"
          >
            Profil joueur
          </button>
          <button
            aria-controls="hero-pool-panel"
            aria-selected={activeTab === 'heroPool'}
            className={`min-h-10 rounded px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'heroPool'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            id="hero-pool-tab"
            onClick={() => setActiveTab('heroPool')}
            role="tab"
            tabIndex={activeTab === 'heroPool' ? 0 : -1}
            type="button"
          >
            Hero pool
          </button>
        </div>
      </header>
      <div
        aria-labelledby={
          activeTab === 'profile' ? 'profile-tab' : 'hero-pool-tab'
        }
        id={activeTab === 'profile' ? 'profile-panel' : 'hero-pool-panel'}
        role="tabpanel"
      >
        {activeTab === 'profile' ? <ProfileForm /> : <HeroPoolManager />}
      </div>
    </section>
  );
}

function PlayerIdentityBadge({
  pseudonym,
  steamId,
  teamId,
  error,
  onSaveSteamId,
  onSaveTeamId,
}: {
  pseudonym: string;
  steamId: string | null;
  teamId: string;
  error: string | null;
  onSaveSteamId: (steamId: string) => Promise<boolean>;
  onSaveTeamId: (teamId: string) => Promise<boolean>;
}) {
  const [draftSteamId, setDraftSteamId] = useState('');
  const [draftTeamId, setDraftTeamId] = useState(teamId);
  const [isSavingSteam, setIsSavingSteam] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [steamError, setSteamError] = useState('');
  const [teamError, setTeamError] = useState('');
  const [steamSaved, setSteamSaved] = useState(false);
  const [teamSaved, setTeamSaved] = useState(false);

  useEffect(() => {
    setDraftSteamId('');
    setSteamError('');
    setSteamSaved(false);
  }, [steamId]);

  useEffect(() => {
    setDraftTeamId(teamId);
    setTeamError('');
    setTeamSaved(false);
  }, [teamId]);

  async function handleSteamSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = draftSteamId.trim();
    if (!normalized) {
      setSteamError('Le Steam ID est obligatoire.');
      return;
    }

    setSteamError('');
    setSteamSaved(false);
    setIsSavingSteam(true);
    const didSave = await onSaveSteamId(normalized);
    setIsSavingSteam(false);
    setSteamSaved(didSave);
    if (!didSave) {
      setSteamError(error ?? "Échec de l'enregistrement.");
    }
  }

  async function handleTeamSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = draftTeamId.trim();
    if (!normalized) {
      setTeamError("L'équipe est obligatoire.");
      return;
    }

    setTeamError('');
    setTeamSaved(false);
    setIsSavingTeam(true);
    const didSave = await onSaveTeamId(normalized);
    setIsSavingTeam(false);
    setTeamSaved(didSave);
    if (!didSave) {
      setTeamError(error ?? "Échec de l'enregistrement.");
    }
  }

  return (
    <div className="grid gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
      <div className="grid gap-0.5">
        <span className="font-semibold text-[var(--text-primary)]">
          {pseudonym}
        </span>
        {steamId ? (
          <label className="grid gap-1 text-xs text-[var(--text-secondary)]">
            Steam ID
            <input
              aria-label="Steam ID"
              className="min-h-8 w-48 rounded border border-[var(--border)] bg-[var(--surface)] px-2 font-mono text-[var(--text-primary)]"
              readOnly
              value={steamId}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
        ) : null}
      </div>
      {!steamId ? (
        <form className="grid gap-2" onSubmit={handleSteamSubmit}>
          <div className="grid gap-1 text-xs font-medium text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2">
              <label htmlFor="steam-id">Steam ID</label>
              <InfoButton />
            </span>
            <input
              className="min-h-9 w-48 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-[var(--text-primary)]"
              id="steam-id"
              inputMode="numeric"
              placeholder="Friend ID"
              value={draftSteamId}
              onChange={(event) => {
                setDraftSteamId(event.target.value);
                setSteamError('');
                setSteamSaved(false);
              }}
            />
          </div>
          <button
            className="min-h-8 rounded bg-[var(--accent)] px-3 text-xs font-semibold text-white disabled:opacity-60"
            disabled={isSavingSteam}
            type="submit"
          >
            {isSavingSteam ? 'Enregistrement...' : 'Ajouter le Steam ID'}
          </button>
          {steamError ? (
            <p className="text-xs text-[var(--danger)]" role="alert">
              {steamError}
            </p>
          ) : null}
          {steamSaved ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Steam ID enregistré.
            </p>
          ) : null}
        </form>
      ) : null}
      <form
        className="grid gap-2 border-t border-[var(--border)] pt-2"
        onSubmit={handleTeamSubmit}
      >
        <label className="grid gap-1 text-xs font-medium text-[var(--text-secondary)]">
          Équipe
          <input
            aria-label="Équipe"
            className="min-h-9 w-48 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-[var(--text-primary)]"
            value={draftTeamId}
            onChange={(event) => {
              setDraftTeamId(event.target.value);
              setTeamError('');
              setTeamSaved(false);
            }}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <button
          className="min-h-8 rounded bg-[var(--accent)] px-3 text-xs font-semibold text-white disabled:opacity-60"
          disabled={isSavingTeam || draftTeamId.trim() === teamId}
          type="submit"
        >
          {isSavingTeam ? 'Enregistrement...' : "Enregistrer l'équipe"}
        </button>
        {teamError ? (
          <p className="text-xs text-[var(--danger)]" role="alert">
            {teamError}
          </p>
        ) : null}
        {teamSaved ? (
          <p className="text-xs text-[var(--text-secondary)]">
            Équipe enregistrée.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function InfoButton() {
  return (
    <button
      aria-label="Aide Steam ID"
      className="group relative grid h-5 w-5 place-items-center rounded-full border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]"
      title="Tu peux trouver ton steam id sur ton profil Dota2 sous 'friend id'"
      type="button"
    >
      i
      <span className="pointer-events-none absolute right-0 top-6 z-10 hidden w-64 rounded border border-[var(--border)] bg-[var(--surface)] p-2 text-left text-xs font-normal text-[var(--text-primary)] shadow-[var(--shadow-panel)] group-hover:block">
        Tu peux trouver ton steam id sur ton profil Dota2 sous &apos;friend
        id&apos;
      </span>
    </button>
  );
}
