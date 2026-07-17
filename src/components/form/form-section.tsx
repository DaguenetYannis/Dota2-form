import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  columns?: 'one' | 'two' | 'three' | 'five';
}

const columnClasses = {
  one: '',
  two: 'md:grid-cols-2',
  three: 'lg:grid-cols-3',
  five: 'md:grid-cols-2 xl:grid-cols-5',
};

export function FormSection({
  title,
  description,
  children,
  columns = 'one',
}: FormSectionProps) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className={`grid gap-4 ${columnClasses[columns]}`}>{children}</div>
    </section>
  );
}
