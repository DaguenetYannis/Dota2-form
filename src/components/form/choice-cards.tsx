interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SingleChoiceCardsProps<T extends string> {
  legend: string;
  name: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

interface MultiChoiceCardsProps<T extends string> {
  legend: string;
  options: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  columns?: 'one' | 'two';
}

export function SingleChoiceCards<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: SingleChoiceCardsProps<T>) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <label
              className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-md border p-3 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)] ${
                selected
                  ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
                  : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
              }`}
              key={option.value}
            >
              <input
                checked={selected}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                name={name}
                type="radio"
                value={option.value}
                onChange={() => onChange(option.value)}
              />
              <span className="grid gap-1">
                <span className="font-semibold">{option.label}</span>
                {option.description ? (
                  <span className="text-sm text-[var(--text-secondary)]">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function MultiChoiceCards<T extends string>({
  legend,
  options,
  value,
  onChange,
  columns = 'two',
}: MultiChoiceCardsProps<T>) {
  const gridClass = columns === 'one' ? 'grid-cols-1' : 'sm:grid-cols-2';

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={`grid gap-3 ${gridClass}`}>
        {options.map((option) => {
          const selected = value.includes(option.value);

          return (
            <label
              className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-md border p-3 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)] ${
                selected
                  ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
                  : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
              }`}
              key={option.value}
            >
              <input
                checked={selected}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                type="checkbox"
                value={option.value}
                onChange={(event) => {
                  if (event.target.checked) {
                    onChange([...value, option.value]);
                  } else {
                    onChange(value.filter((item) => item !== option.value));
                  }
                }}
              />
              <span className="grid gap-1">
                <span className="font-semibold">{option.label}</span>
                {option.description ? (
                  <span className="text-sm text-[var(--text-secondary)]">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
