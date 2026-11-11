import { useId, useState } from 'react';

type Range = { from: string; to: string };
type Props = { initial: Range; pending: boolean; onChange: (range: Range) => void };
export function DoseHistoryRange({ initial, pending, onChange }: Props) {
  const id = useId();
  const [range, setRange] = useState(initial);
  const [error, setError] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const days = (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000 + 1;
        const valid = Number.isFinite(days) && days >= 1 && days <= 366;
        setError(!valid);
        if (valid && !pending) onChange(range);
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
        Xem nhật ký theo ngày
      </button>
    </form>
  );
}
