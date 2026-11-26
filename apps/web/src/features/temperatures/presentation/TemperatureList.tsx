import type { TemperatureReading } from '@angia/contracts';
import { formatDoseTime } from '@src/features/asNeededDoses/application/formatDoseTime';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

type Props = {
  readings: TemperatureReading[];
  pending: boolean;
  onRemove?: ((reading: TemperatureReading) => void) | undefined;
};

export function TemperatureList({ readings, pending, onRemove }: Props) {
  const latest = readings.at(-1);
  const formatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (!latest) return <p className="text-caption text-text-secondary">Chưa ghi nhiệt độ.</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/35 bg-accent-soft/80 p-4">
        <div className="flex items-center gap-3">
          <ProfileSectionIcon name="thermostat" size={38} />
          <div>
            <p className="text-caption text-text-secondary">Gần nhất</p>
            <p className="text-heading-1 font-bold text-text-primary tabular-nums">
              {formatter.format(latest.celsius)} °C
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border/30 bg-surface px-3 py-1 text-caption font-medium text-text-secondary tabular-nums">
          {formatDoseTime(latest.measuredAt)}
        </span>
      </div>
      <ul aria-label="Các bản ghi nhiệt độ" className="grid gap-2.5 md:grid-cols-2">
        {readings.map((reading) => (
          <li
            key={reading.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/35 bg-bg px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <ProfileSectionIcon name="thermostat" size={26} />
              <div className="flex flex-col">
                <span className="text-body font-bold text-text-primary tabular-nums">
                  {formatter.format(reading.celsius)} °C
                </span>
                <time dateTime={reading.measuredAt} className="text-caption text-text-secondary tabular-nums">
                  {formatDoseTime(reading.measuredAt)}
                </time>
              </div>
            </div>
            {onRemove && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onRemove(reading)}
                aria-label={`Xóa bản ghi ${formatter.format(reading.celsius)} °C lúc ${formatDoseTime(reading.measuredAt)}`}
                className="inline-flex min-h-btn cursor-pointer items-center gap-1 rounded-2xl bg-danger-soft/60 px-3 text-button-secondary font-semibold text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
              >
                <AdminIcon name="delete_outline" size={16} />
                Xóa bản ghi
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
