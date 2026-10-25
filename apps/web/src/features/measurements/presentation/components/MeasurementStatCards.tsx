import { displayReadingText, formatDay } from '../../application/formatMeasurement';
import type { SeriesPoint } from '../../application/ports';

// Design §2.2: dưới 4 điểm thì không dựng biểu đồ; mỗi số đo một thẻ, mới nhất trước, không nhận xét (BR-033).
export function MeasurementStatCards({ points, weeks }: { points: SeriesPoint[]; weeks: number }) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-3">
        {[...points].reverse().map((point) => {
          const [value = '', unit = ''] = splitReading(displayReadingText(point));
          return (
            <li key={point.id} className="flex flex-col gap-1 rounded-xl bg-[#eaf6f5] p-4">
              <p className="tabular-nums text-[#131d1d]">
                <span className="text-3xl font-semibold tracking-tight">{value}</span>{' '}
                <span className="text-sm text-[#55615f]">{unit}</span>
              </p>
              {point.kind === 'blood_pressure' && point.pulse !== null && (
                <p className="text-sm text-[#404945]">Mạch: {point.pulse} lần/phút</p>
              )}
              <p className="text-sm text-[#55615f]">
                {formatDay(point.measuredOn)}
                {point.measuredTime ? ` · ${point.measuredTime}` : ''}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-[#55615f]">Cần ít nhất 4 lần đo trong {weeks} tuần để vẽ biểu đồ.</p>
    </div>
  );
}

const splitReading = (text: string) => {
  const index = text.lastIndexOf(' ');
  return index === -1 ? [text, ''] : [text.slice(0, index), text.slice(index + 1)];
};
