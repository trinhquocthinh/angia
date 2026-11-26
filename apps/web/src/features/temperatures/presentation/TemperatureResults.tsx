import type { TemperatureReading } from '@angia/contracts';
import { TemperatureList } from './TemperatureList';

type Props = {
  readings: TemperatureReading[] | undefined;
  error: boolean;
  retry: () => void;
  pending: boolean;
  onRemove?: ((reading: TemperatureReading) => void) | undefined;
};
export function TemperatureResults({ readings, error, retry, pending, onRemove }: Props) {
  if (error)
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl bg-danger-soft p-4 text-caption"
      >
        <p className="text-body font-medium text-text-primary">Không thể tải nhiệt độ. Vui lòng thử lại.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-btn rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent"
        >
          Thử lại
        </button>
      </div>
    );
  if (!readings)
    return (
      <div
        role="status"
        className="animate-pulse rounded-2xl border border-border/35 bg-bg p-5 text-caption text-text-secondary motion-reduce:animate-none"
      >
        Đang tải nhiệt độ…
      </div>
    );
  return <TemperatureList readings={readings} pending={pending} onRemove={onRemove} />;
}
