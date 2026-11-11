import type { TemperatureReading } from '@angia/contracts';
import { formatDoseTime } from '@src/features/asNeededDoses/application/formatDoseTime';

type Props = {
  readings: TemperatureReading[];
  pending: boolean;
  onRemove?: ((reading: TemperatureReading) => void) | undefined;
};
export function TemperatureList({ readings, pending, onRemove }: Props) {
  const latest = readings.at(-1);
  const formatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (!latest) return <p className="text-sm text-text-secondary">Chưa ghi nhiệt độ.</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Gần nhất trong khoảng đã chọn:{' '}
        <strong className="tabular-nums text-text-primary">{formatter.format(latest.celsius)} °C</strong>
        {' · '}
        {formatDoseTime(latest.measuredAt)}
      </p>
      <ul
        aria-label="Các bản ghi nhiệt độ"
        className="flex flex-col divide-y divide-[var(--color-accent-soft)]"
      >
        {readings.map((reading) => (
          <li key={reading.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex flex-col gap-1">
              <span className="font-semibold tabular-nums text-text-primary">
                {formatter.format(reading.celsius)} °C
              </span>
              <time dateTime={reading.measuredAt} className="text-sm text-text-secondary">
                {formatDoseTime(reading.measuredAt)}
              </time>
            </div>
            {onRemove && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onRemove(reading)}
                aria-label={`Xóa bản ghi ${formatter.format(reading.celsius)} °C lúc ${formatDoseTime(reading.measuredAt)}`}
                className="min-h-11 rounded-xl px-3 text-sm text-danger disabled:opacity-50"
              >
                Xóa bản ghi
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
