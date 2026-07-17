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
      <legend className="text-sm font-medium text-slate-800">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <input
              checked={value.includes(option.value)}
              className="h-4 w-4"
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
