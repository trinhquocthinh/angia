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
    <section aria-label="Các lần ghi" className="profile-bento-card space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="auth-heading text-heading-2 font-semibold text-accent">Các lần ghi</h2>
        <span className="rounded-full bg-secondary-container px-3 py-0.5 text-caption font-semibold text-on-secondary-container tabular-nums">
          {sorted.length}
        </span>
      </div>
      <ul className="space-y-2.5">
        {sorted.map((entry) => (
          <li key={entry.id} className="min-w-0 space-y-1.5 rounded-2xl border border-border/35 bg-bg p-4">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="flex min-h-11 w-full cursor-pointer flex-wrap items-center justify-between gap-2 rounded-xl text-left transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                aria-label={`Sửa lần ghi ${formatPainEntryTime(entry.recordedAt)}`}
              >
                <span className="rounded-xl border border-border/30 bg-surface px-3 py-1 text-heading-3 font-bold text-text-primary tabular-nums">
                  {entry.level}/10
                </span>
                <span className="text-caption font-medium text-text-secondary tabular-nums">
                  {formatPainEntryTime(entry.recordedAt)}
                </span>
              </button>
            ) : (
              <p className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-xl border border-border/30 bg-surface px-3 py-1 text-heading-3 font-bold text-text-primary tabular-nums">
                  {entry.level}/10
                </span>
                <span className="text-caption font-medium text-text-secondary tabular-nums">
                  {formatPainEntryTime(entry.recordedAt)}
                </span>
              </p>
            )}
            {entry.note && (
              <p className="whitespace-pre-wrap break-words text-body text-text-primary">{entry.note}</p>
            )}
            <RecordedBy createdBy={entry.createdBy} updatedBy={entry.updatedBy} />
          </li>
        ))}
      </ul>
    </section>
  );
}
