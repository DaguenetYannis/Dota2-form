'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { HeroPoolManager } from '@/features/hero-pool/hero-pool-manager';
import { ProfileForm } from '@/features/player-profile/profile-form';
import { PseudoEntry } from './pseudo-entry';
import { useAppState } from '@/lib/app-state';

type PlayerTab = 'profile' | 'heroPool';

export function PlayerSpace() {
  const { currentPlayer, updateSteamId, error } = useAppState();
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
            onSaveSteamId={updateSteamId}
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
  error,
  onSaveSteamId,
}: {
  pseudonym: string;
  steamId: string | null;
  error: string | null;
  onSaveSteamId: (steamId: string) => Promise<boolean>;
}) {
  const [draftSteamId, setDraftSteamId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraftSteamId('');
    setLocalError('');
    setSaved(false);
  }, [steamId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = draftSteamId.trim();
    if (!normalized) {
      setLocalError('Le Steam ID est obligatoire.');
      return;
    }

    setLocalError('');
    setSaved(false);
    setIsSaving(true);
    const didSave = await onSaveSteamId(normalized);
    setIsSaving(false);
    setSaved(didSave);
    if (!didSave) {
      setLocalError(error ?? "Échec de l'enregistrement.");
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
        <form className="grid gap-2" onSubmit={handleSubmit}>
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
                setLocalError('');
                setSaved(false);
              }}
            />
          </div>
          <button
            className="min-h-8 rounded bg-[var(--accent)] px-3 text-xs font-semibold text-white disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Enregistrement...' : 'Ajouter le Steam ID'}
          </button>
          {localError ? (
            <p className="text-xs text-[var(--danger)]" role="alert">
              {localError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Steam ID enregistré.
            </p>
          ) : null}
        </form>
      ) : null}
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
