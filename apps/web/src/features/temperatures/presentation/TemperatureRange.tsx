import { useId, useState } from 'react';
import { temperatureQuerySchema } from '@angia/contracts';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
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
      className="flex flex-col gap-3 rounded-[20px] bg-bg p-3.5 md:flex-row md:items-end"
    >
      <fieldset disabled={pending} className="grid min-w-0 flex-1 grid-cols-2 gap-3 border-0 p-0">
        {(['from', 'to'] as const).map((field) => (
          <label
            key={field}
            htmlFor={`${id}-${field}`}
            className="flex min-w-0 flex-col gap-1 text-caption font-semibold text-text-secondary"
          >
            {field === 'from' ? 'Từ ngày' : 'Đến ngày'}
            <input
              id={`${id}-${field}`}
              type="date"
              required
              value={range[field]}
              onChange={(event) => setRange({ ...range, [field]: event.target.value })}
              className="min-h-btn min-w-0 rounded-2xl border border-border/60 bg-surface px-3 text-caption text-text-primary focus-visible:outline-2 focus-visible:outline-focus"
            />
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-caption font-medium text-danger md:order-last md:basis-full">
          Chọn khoảng ngày hợp lệ, tối đa 366 ngày.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-btn shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-accent-soft px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-choice-soft disabled:opacity-50"
      >
        <AdminIcon name="search" size={18} />
        Xem nhiệt độ theo ngày
      </button>
    </form>
  );
}
