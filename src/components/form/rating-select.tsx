import { Field } from './field';

interface RatingSelectProps {
  id: string;
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}

export function RatingSelect({
  id,
  label,
  value,
  min,
  onChange,
}: RatingSelectProps) {
  return (
    <Field htmlFor={id} label={label}>
      <select
        className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--text-primary)]"
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {Array.from({ length: 6 - min }, (_, index) => index + min).map(
          (rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ),
        )}
      </select>
    </Field>
  );
}
