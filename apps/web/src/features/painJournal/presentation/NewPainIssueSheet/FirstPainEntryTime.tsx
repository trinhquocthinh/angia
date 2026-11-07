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
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          Thời điểm (giờ Việt Nam)
          <input
            type="datetime-local"
            required
            max={localNow}
            value={values.recordedAt}
            onChange={(event) => onChange({ recordedAt: event.target.value })}
            className="min-h-11 min-w-0 rounded-xl border border-border p-2"
          />
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => {
              setCustomTime(false);
              onChange({ recordedAt: '' });
            }}
          >
            Dùng thời điểm bây giờ
          </button>
        </label>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>Thời điểm: Bây giờ · {localNow.slice(11)}</span>
          <button
            type="button"
            className="min-h-11 underline"
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
