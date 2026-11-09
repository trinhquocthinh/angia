import type { PainEntry } from '@angia/contracts';
import { formatPainEntryTime } from '../PainIssueDetail/formatPainEntryTime';
export function PainChartCards({ entries, weeks }: { entries: PainEntry[]; weeks: number }) {
  return (
    <div className="space-y-3">
      {entries.length === 0 && <p>Chưa có lần ghi trong {weeks} tuần gần đây.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {entries.toReversed().map((entry) => (
          <li key={entry.id} className="min-w-0 rounded-xl border border-[#E4E0DA] p-4">
            <p className="text-[#1F2A2A]">
              <span className="text-3xl font-semibold tabular-nums">{entry.level}</span>
              <span className="text-sm">/10</span>
            </p>
            <time className="text-sm text-[#55615F]" dateTime={entry.recordedAt}>
              {formatPainEntryTime(entry.recordedAt)}
            </time>
            {entry.note && <p className="break-words text-sm">{entry.note}</p>}
          </li>
        ))}
      </ul>
      <p className="text-sm text-[#55615F]">Cần ít nhất 4 lần ghi trong {weeks} tuần để vẽ biểu đồ.</p>
    </div>
  );
}
