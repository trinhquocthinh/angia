import type { Prescription } from '@angia/contracts';
import { doseSlotLabel } from '@src/features/documents/application/doseSlots';
import { doseLabel } from '@src/features/medications/application/doseLabel';

export function PrescriptionItems({ items }: { items: Prescription['items'] }) {
  return (
    <ol className="flex min-w-0 flex-col gap-3 text-sm">
      {items.map((item, index) => (
        <li
          key={`${item.id}:${index}`}
          className="min-w-0 rounded-xl border border-[#d9e5e4] p-4 break-words"
        >
          <p className="font-semibold text-[#004135]">
            {item.name}
            {item.strength ? ` · ${item.strength}` : ''}
          </p>
          <p className="mt-1">{doseLabel(item.quantityPerDose, item.doseUnit)}</p>
          <p>Buổi: {item.slots.length ? item.slots.map(doseSlotLabel).join(', ') : 'Không ghi'}</p>
          <p>
            {item.longTerm
              ? 'Dài hạn'
              : item.durationDays === null
                ? 'Số ngày: Không ghi'
                : `${item.durationDays} ngày`}
          </p>
          {item.externalUse && <p>Dùng ngoài</p>}
          {item.totalQuantity !== null && (
            <p>
              Tổng số lượng: {item.totalQuantity.toLocaleString('vi-VN')}
              {item.doseUnit ? ` ${item.doseUnit}` : ''}
            </p>
          )}
          {item.note && (
            <p className="mt-2 whitespace-pre-wrap text-[#55615f]">Ghi chú trên đơn: {item.note}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
