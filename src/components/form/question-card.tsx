import type { ReactNode } from 'react';

interface QuestionCardProps {
  id: string;
  sectionLabel?: string;
  question: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export function QuestionCard({
  id,
  sectionLabel,
  question,
  helperText,
  error,
  children,
}: QuestionCardProps) {
  const headingId = `${id}-heading`;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <section
      aria-describedby={helperId}
      aria-labelledby={headingId}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)] sm:p-5"
    >
      {sectionLabel ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-hover)]">
          {sectionLabel}
        </p>
      ) : null}
      <h2
        className="text-lg font-semibold leading-snug text-[var(--text-primary)]"
        id={headingId}
      >
        {question}
      </h2>
      {helperText ? (
        <p className="mt-2 text-sm text-[var(--text-secondary)]" id={helperId}>
          {helperText}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
      {error ? (
        <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
