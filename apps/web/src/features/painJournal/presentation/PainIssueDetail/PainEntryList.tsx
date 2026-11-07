import type { PainEntry } from '@angia/contracts';
import { RecordedBy } from './RecordedBy';
import { formatPainEntryTime } from './formatPainEntryTime';

export function PainEntryList({
  entries,
  onEdit,
}: {
  entries: PainEntry[];
  onEdit?: ((entry: PainEntry) => void) | undefined;
}) {
  const sorted = [...entries].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  return (
    <section aria-label="Các lần ghi" className="space-y-3">
      <h2 className="text-xl font-semibold">Các lần ghi</h2>
      <ul className="space-y-3">
        {sorted.map((entry) => (
          <li key={entry.id} className="min-w-0 rounded-xl border border-border p-4">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="min-h-11 w-full text-left underline"
                aria-label={`Sửa lần ghi ${formatPainEntryTime(entry.recordedAt)}`}
              >
                {entry.level}/10 · {formatPainEntryTime(entry.recordedAt)}
              </button>
            ) : (
              <p>
                {entry.level}/10 · {formatPainEntryTime(entry.recordedAt)}
              </p>
            )}
            {entry.note && <p className="whitespace-pre-wrap break-words">{entry.note}</p>}
            <RecordedBy createdBy={entry.createdBy} updatedBy={entry.updatedBy} />
          </li>
        ))}
      </ul>
    </section>
  );
}
