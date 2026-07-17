interface Option<T extends string> {
  value: T;
  label: string;
}

interface MultiCheckboxProps<T extends string> {
  legend: string;
  options: Option<T>[];
  value: T[];
  onChange: (next: T[]) => void;
}

export function MultiCheckbox<T extends string>({
  legend,
  options,
  value,
  onChange,
}: MultiCheckboxProps<T>) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-[var(--text-primary)]">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
              value.includes(option.value)
                ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
                : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
            }`}
          >
            <input
              checked={value.includes(option.value)}
              className="h-4 w-4 accent-[var(--accent)]"
              type="checkbox"
              onChange={(event) => {
                if (event.target.checked) {
                  onChange([...value, option.value]);
                } else {
                  onChange(value.filter((item) => item !== option.value));
                }
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
