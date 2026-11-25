import { displayReadingText, formatDay } from '../../application/formatMeasurement';
import type { SeriesPoint } from '../../application/ports';

// Design §2.2: dưới 4 điểm thì không dựng biểu đồ; mỗi số đo một thẻ Bento trung tính (BR-033).
export function MeasurementStatCards({ points, weeks }: { points: SeriesPoint[]; weeks: number }) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-3">
        {[...points].reverse().map((point) => {
          const [value = '', unit = ''] = splitReading(displayReadingText(point));
          return (
            <li key={point.id} className="flex flex-col gap-1 rounded-2xl bg-bg p-4">
              <p className="tabular-nums text-text-primary">
                <span className="text-heading-1 font-semibold tracking-tight">{value}</span>{' '}
                <span className="text-caption text-text-secondary">{unit}</span>
              </p>
              {point.kind === 'blood_pressure' && point.pulse !== null && (
                <p className="text-caption text-text-secondary tabular-nums">Mạch: {point.pulse} lần/phút</p>
              )}
              <p className="text-caption text-text-secondary tabular-nums">
                {formatDay(point.measuredOn)}
                {point.measuredTime ? ` · ${point.measuredTime}` : ''}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="text-caption text-text-secondary">
        Cần ít nhất 4 lần đo trong {weeks} tuần để vẽ biểu đồ.
      </p>
    </div>
  );
}

const splitReading = (text: string) => {
  const index = text.lastIndexOf(' ');
  return index === -1 ? [text, ''] : [text.slice(0, index), text.slice(index + 1)];
};
