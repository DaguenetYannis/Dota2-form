export type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

const labels: Record<SaveState, string> = {
  idle: 'Non enregistré',
  saving: 'Enregistrement...',
  saved: 'Enregistré',
  failed: "Échec de l'enregistrement",
};

const tones: Record<SaveState, string> = {
  idle: 'border-[var(--border)] text-[var(--text-secondary)]',
  saving: 'border-[var(--focus-ring)] text-[var(--focus-ring)]',
  saved: 'border-[var(--success)] text-[var(--success)]',
  failed: 'border-[var(--danger)] text-[var(--danger)]',
};

export function SaveStatus({ state }: { state: SaveState }) {
  return (
    <p
      aria-live="polite"
      className={`inline-flex min-h-9 items-center rounded-full border bg-[rgb(255_255_255_/_0.03)] px-3 text-sm font-medium ${tones[state]}`}
    >
      {labels[state]}
    </p>
  );
}
