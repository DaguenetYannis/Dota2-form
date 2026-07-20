'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAppState } from '@/lib/app-state';

export function PseudoEntry() {
  const router = useRouter();
  const { resolvePlayer, error } = useAppState();
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      setLocalError('Le pseudo ou Steam ID est obligatoire.');
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);
    const player = await resolvePlayer(identifier);
    setIsSubmitting(false);

    if (player) {
      router.push('/player');
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-md content-center gap-6">
      <form
        className="grid gap-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)] sm:p-7"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-hover)]">
            Dota Profiles
          </p>
          <label
            className="text-2xl font-bold text-[var(--text-primary)]"
            htmlFor="player-identifier"
          >
            Quel est ton pseudo ou Steam ID ?
          </label>
          <p className="text-sm text-[var(--text-secondary)]">
            Retrouve ton profil ou commence-en un nouveau.
          </p>
        </div>
        <div className="grid gap-2">
          <input
            autoComplete="nickname"
            autoFocus
            className="min-h-12 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            id="player-identifier"
            placeholder="Ton pseudo ou Steam ID"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              if (localError) {
                setLocalError(null);
              }
            }}
          />
        </div>
        {localError || error ? (
          <p
            className="rounded-md border border-[rgb(239_120_109_/_0.5)] bg-[rgb(239_120_109_/_0.12)] p-3 text-sm text-[var(--danger)]"
            role="alert"
          >
            {localError ?? error}
          </p>
        ) : null}
        <button
          className="min-h-11 rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          Continuer
        </button>
      </form>
    </section>
  );
}
