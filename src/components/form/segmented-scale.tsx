interface SegmentedScaleProps {
  legend: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  labels: {
    low: string;
    mid: string;
    high: string;
  };
}

function getDescription(value: number, labels: SegmentedScaleProps['labels']) {
  if (value === 1) {
    return labels.low;
  }
  if (value === 3) {
    return labels.mid;
  }
  if (value === 5) {
    return labels.high;
  }
  return undefined;
}

export function SegmentedScale({
  legend,
  name,
  value,
  onChange,
  labels,
}: SegmentedScaleProps) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((rating) => {
            const selected = rating === value;
            const description = getDescription(rating, labels);

            return (
              <label
                className={`flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)] ${
                  selected
                    ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                }`}
                key={rating}
              >
                <input
                  checked={selected}
                  className="sr-only"
                  name={name}
                  type="radio"
                  value={rating}
                  onChange={() => onChange(rating)}
                />
                <span className="text-base font-bold">{rating}</span>
                {description ? (
                  <span className="mt-1 text-xs leading-snug">
                    {description}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
        <div className="grid gap-1 text-xs text-[var(--text-secondary)] sm:grid-cols-3">
          <span>1 — {labels.low}</span>
          <span className="sm:text-center">3 — {labels.mid}</span>
          <span className="sm:text-right">5 — {labels.high}</span>
        </div>
      </div>
    </fieldset>
  );
}
