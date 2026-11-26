import { useEffect, useState } from 'react';
import type { FirstEntryFieldsProps } from './newPainIssueTypes';
export function FirstPainEntryTime({ values, onChange }: FirstEntryFieldsProps) {
  const [customTime, setCustomTime] = useState(Boolean(values.recordedAt));
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const localNow = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 16);
  return (
    <>
      {customTime ? (
        <label className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border/35 bg-bg p-3.5 text-caption font-semibold text-text-secondary">
          Thời điểm (giờ Việt Nam)
          <input
            type="datetime-local"
            required
            max={localNow}
            value={values.recordedAt}
            onChange={(event) => onChange({ recordedAt: event.target.value })}
            className="min-h-12 min-w-0 rounded-2xl border border-border/55 bg-surface px-3 text-body font-normal text-text-primary focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            className="min-h-11 self-start rounded-xl px-2 font-semibold text-accent underline underline-offset-4"
            onClick={() => {
              setCustomTime(false);
              onChange({ recordedAt: '' });
            }}
          >
            Dùng thời điểm bây giờ
          </button>
        </label>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/35 bg-bg px-4 py-2.5 text-caption">
          <span className="font-medium text-text-secondary tabular-nums">
            Thời điểm: Bây giờ · {localNow.slice(11)}
          </span>
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border/45 bg-surface px-3.5 font-semibold text-accent transition-colors hover:bg-accent-soft"
            onClick={() => {
              setCustomTime(true);
              onChange({ recordedAt: localNow });
            }}
          >
            Đổi thời điểm
          </button>
        </div>
      )}
    </>
  );
}
