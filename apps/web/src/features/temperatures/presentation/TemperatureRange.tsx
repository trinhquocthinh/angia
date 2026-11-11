import { useId, useState } from 'react';
import { temperatureQuerySchema } from '@angia/contracts';
import type { TemperatureRangeQuery } from '../application/ports';

type Props = {
  initial: TemperatureRangeQuery;
  pending: boolean;
  onChange: (range: TemperatureRangeQuery) => void;
};
export function TemperatureRange({ initial, pending, onChange }: Props) {
  const id = useId();
  const [range, setRange] = useState(initial);
  const [error, setError] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = temperatureQuerySchema.safeParse(range);
        setError(!parsed.success);
        if (parsed.success && !pending) onChange(parsed.data);
      }}
      className="flex flex-col gap-3"
    >
      <fieldset disabled={pending} className="grid min-w-0 grid-cols-2 gap-3 border-0 p-0">
        {(['from', 'to'] as const).map((field) => (
          <label key={field} htmlFor={`${id}-${field}`} className="flex min-w-0 flex-col gap-1 text-sm">
            {field === 'from' ? 'Từ ngày' : 'Đến ngày'}
            <input
              id={`${id}-${field}`}
              type="date"
              required
              value={range[field]}
              onChange={(event) => setRange({ ...range, [field]: event.target.value })}
              className="min-h-11 min-w-0 rounded-xl border border-border px-2"
            />
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-danger">
          Chọn khoảng ngày hợp lệ, tối đa 366 ngày.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-xl bg-accent-soft px-4 text-sm font-semibold text-accent disabled:opacity-50"
      >
        Xem nhiệt độ theo ngày
      </button>
    </form>
  );
}
