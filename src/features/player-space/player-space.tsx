'use client';

import { useState } from 'react';
import { HeroPoolManager } from '@/features/hero-pool/hero-pool-manager';
import { ProfileForm } from '@/features/player-profile/profile-form';
import { PseudoEntry } from './pseudo-entry';
import { useAppState } from '@/lib/app-state';

type PlayerTab = 'profile' | 'heroPool';

export function PlayerSpace() {
  const { currentPlayer } = useAppState();
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
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1 text-sm text-[var(--text-primary)]">
            {currentPlayer.pseudonym}
          </span>
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
