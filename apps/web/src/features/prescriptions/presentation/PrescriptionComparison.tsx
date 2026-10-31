import type { PrescriptionDiff } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { PrescriptionItems } from './PrescriptionItems';
import { PrescriptionFieldChange } from './PrescriptionFieldChange';

type Props = { diff: PrescriptionDiff | null; previousDate: string | null; currentDate: string };
export function PrescriptionComparison({ diff, previousDate, currentDate }: Props) {
  if (!diff) return null;
  const empty = !diff.added.length && !diff.removed.length && !diff.changed.length;
  return (
    <section aria-label="Thay đổi so với đơn trước" className="min-w-0 rounded-[20px] bg-white p-5">
      <h2 className="text-lg font-semibold text-[#004135]">Thay đổi so với đơn trước</h2>
      <p className="mt-2 text-sm text-[#55615f]">
        Trước: {previousDate ? formatDay(previousDate) : 'Không rõ ngày'} · Sau: {formatDay(currentDate)}
      </p>
      {empty ? (
        <p className="mt-4 text-sm">Không có thay đổi ở các trường được so sánh.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-6">
          {(['added', 'removed'] as const).map((kind) => (
            <section key={kind} aria-label={kind === 'added' ? 'Thêm' : 'Bỏ'}>
              <h3 className="mb-3 font-semibold text-[#004135]">
                {kind === 'added' ? 'Thêm' : 'Bỏ'} ({diff[kind].length})
              </h3>
              {diff[kind].length ? (
                diff[kind].map((group, index) => (
                  <div key={`${group.name}:${index}`} className="mb-3">
                    <PrescriptionItems items={group.items} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#55615f]">Không có.</p>
              )}
            </section>
          ))}
          <section aria-label="Thay đổi">
            <h3 className="mb-3 font-semibold text-[#004135]">Thay đổi ({diff.changed.length})</h3>
            {diff.changed.length ? (
              diff.changed.map((group, index) => (
                <article
                  key={`${group.name}:${index}`}
                  className="mb-3 min-w-0 rounded-xl border border-[#d9e5e4] p-4"
                >
                  <h4 className="font-semibold break-words text-[#004135]">{group.name}</h4>
                  {group.changes.map((change, i) => (
                    <PrescriptionFieldChange key={`${change.field}:${i}`} change={change} />
                  ))}
                </article>
              ))
            ) : (
              <p className="text-sm text-[#55615f]">Không có.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
