import type { Prescription } from '@angia/contracts';
import { doseSlotLabel } from '@src/features/documents/application/doseSlots';
import { doseLabel } from '@src/features/medications/application/doseLabel';

const monogram = (name: string) => name.trim().slice(0, 2).toUpperCase() || 'Rx';

export function PrescriptionItems({ items }: { items: Prescription['items'] }) {
  return (
    <ol className="flex min-w-0 flex-col gap-3 text-caption">
      {items.map((item, index) => (
        <li
          key={`${item.id}:${index}`}
          className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-border/35 bg-bg p-4 break-words"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/35 bg-surface text-caption font-bold text-accent"
              >
                {monogram(item.name)}
              </span>
              <div className="min-w-0">
                <p className="text-body font-semibold text-accent">
                  {item.name}
                  {item.strength ? ` · ${item.strength}` : ''}
                </p>
                <p className="mt-0.5 text-caption font-medium text-text-primary">
                  {doseLabel(item.quantityPerDose, item.doseUnit)}
                </p>
              </div>
            </div>
            {item.totalQuantity !== null && (
              <span className="shrink-0 rounded-xl border border-border/35 bg-surface px-3 py-1 text-caption font-semibold text-accent tabular-nums">
                Tổng số lượng: {item.totalQuantity.toLocaleString('vi-VN')}
                {item.doseUnit ? ` ${item.doseUnit}` : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
            <span className="rounded-full bg-surface px-2.5 py-0.5 font-medium text-text-primary">
              Buổi: {item.slots.length ? item.slots.map(doseSlotLabel).join(', ') : 'Không ghi'}
            </span>
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-medium text-text-secondary">
              {item.longTerm
                ? 'Dài hạn'
                : item.durationDays === null
                  ? 'Số ngày: Không ghi'
                  : `${item.durationDays} ngày`}
            </span>
            {item.externalUse && (
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">
                Dùng ngoài
              </span>
            )}
          </div>
          {item.note && (
            <p className="rounded-xl border border-border/25 bg-surface px-3 py-2 whitespace-pre-wrap text-text-secondary">
              Ghi chú trên đơn: {item.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
