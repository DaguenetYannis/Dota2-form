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
        className="rounded-md border border-slate-300 bg-white px-3 py-2"
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
