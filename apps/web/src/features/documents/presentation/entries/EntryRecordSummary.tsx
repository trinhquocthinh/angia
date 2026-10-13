import type { DocumentEntry } from '@angia/contracts';
import { doseSlotLabel } from '../../application/doseSlots';
import { doseLabel } from '@src/features/medications/application/doseLabel';
import { readingText } from '@src/features/measurements/application/formatMeasurement';

type Records = DocumentEntry['records'];

// Tóm tắt bản ghi đã lưu: chỉ mô tả nguyên văn, không tô màu hay nhận định (BR-033).
export function EntryRecordSummary({ records }: { records: Records }) {
  const { prescription, labResults, measurements } = records;
  if (!prescription && labResults.length === 0 && measurements.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2 rounded-xl bg-[#eaf6f5] p-4 text-sm text-[#131d1d]">
      {prescription?.items.map((item) => (
        <li key={item.id} className="flex flex-wrap justify-between gap-x-3">
          <span className="font-semibold">
            {item.name}
            {item.strength ? ` ${item.strength}` : ''}
          </span>
          <span className="text-[#404945]">
            {doseLabel(item.quantityPerDose, item.doseUnit)} · {item.slots.map(doseSlotLabel).join(', ')} ·{' '}
            {item.longTerm ? 'Dài hạn' : `${item.durationDays} ngày`}
          </span>
        </li>
      ))}
      {labResults.map((result) => (
        <li key={result.id} className="flex flex-col">
          <span className="flex flex-wrap justify-between gap-x-3">
            <span className="font-semibold">{result.testName}</span>
            <span className="tabular-nums">
              {result.value}
              {result.unit ? ` ${result.unit}` : ''}
            </span>
          </span>
          <span className="text-xs text-[#55615f]">
            {result.referenceRange
              ? `Khoảng tham chiếu trên phiếu: ${result.referenceRange}`
              : 'Phiếu không in khoảng tham chiếu'}
          </span>
        </li>
      ))}
      {measurements.map((measurement) => (
        <li key={measurement.id} className="flex flex-wrap justify-between gap-x-3">
          <span className="font-semibold">
            {measurement.kind === 'blood_pressure' ? 'Huyết áp' : 'Đường huyết'}
          </span>
          <span className="tabular-nums">
            {readingText(measurement)}
            {measurement.pulse !== null ? ` · Mạch ${measurement.pulse}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
