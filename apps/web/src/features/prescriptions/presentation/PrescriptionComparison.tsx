import type { PrescriptionDiff } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { PrescriptionItems } from './PrescriptionItems';
import { PrescriptionFieldChange } from './PrescriptionFieldChange';

function DiffLineGroup({
  title,
  symbol,
  groups,
}: {
  title: string;
  symbol: string;
  groups: PrescriptionDiff['added'];
}) {
  return (
    <section aria-label={title} className="rounded-2xl border border-border/35 bg-bg p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-caption font-bold text-accent"
        >
          {symbol}
        </span>
        <h3 className="text-body font-semibold text-accent">
          {title} ({groups.length})
        </h3>
      </div>
      {groups.length ? (
        <div className="flex flex-col gap-3">
          {groups.map((group, index) => (
            <div key={`${group.name}:${index}`}>
              <PrescriptionItems items={group.items} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-caption text-text-secondary">Không có.</p>
      )}
    </section>
  );
}

type Props = { diff: PrescriptionDiff | null; previousDate: string | null; currentDate: string };
export function PrescriptionComparison({ diff, previousDate, currentDate }: Props) {
  if (!diff) return null;
  const total = diff.added.length + diff.removed.length + diff.changed.length;
  return (
    <section aria-label="Thay đổi so với đơn trước" className="profile-bento-card min-w-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/30 pb-4">
        <div>
          <h2 className="auth-heading text-heading-2 font-semibold text-accent">Thay đổi so với đơn trước</h2>
          <p className="mt-1 text-caption text-text-secondary tabular-nums">
            Trước: {previousDate ? formatDay(previousDate) : 'Không rõ ngày'} · Sau: {formatDay(currentDate)}
          </p>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-secondary-container px-3 py-1 text-caption font-semibold text-on-secondary-container tabular-nums">
            {total} mục khác nhau
          </span>
        )}
      </div>
      {total === 0 ? (
        <p className="mt-4 text-body text-text-secondary">Không có thay đổi ở các trường được so sánh.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          <DiffLineGroup title="Thêm" symbol="+" groups={diff.added} />
          <DiffLineGroup title="Bỏ" symbol="−" groups={diff.removed} />
          <section aria-label="Thay đổi" className="rounded-2xl border border-border/35 bg-bg p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-caption font-bold text-accent"
              >
                ⇄
              </span>
              <h3 className="text-body font-semibold text-accent">Thay đổi ({diff.changed.length})</h3>
            </div>
            {diff.changed.length ? (
              <div className="flex flex-col gap-3">
                {diff.changed.map((group, index) => (
                  <article
                    key={`${group.name}:${index}`}
                    className="min-w-0 rounded-2xl border border-border/35 bg-surface p-4"
                  >
                    <h4 className="text-body font-semibold break-words text-accent">{group.name}</h4>
                    {group.changes.map((change, i) => (
                      <PrescriptionFieldChange key={`${change.field}:${i}`} change={change} />
                    ))}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-caption text-text-secondary">Không có.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
