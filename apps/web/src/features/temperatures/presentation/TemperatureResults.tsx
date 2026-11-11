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
      <div role="alert" className="flex flex-col gap-2 text-sm">
        <p>Không thể tải nhiệt độ. Vui lòng thử lại.</p>
        <button type="button" onClick={retry} className="min-h-11 rounded-xl bg-accent-soft px-4 text-accent">
          Thử lại
        </button>
      </div>
    );
  if (!readings)
    return (
      <div role="status" className="animate-pulse rounded-xl bg-accent-soft p-5 text-sm">
        Đang tải nhiệt độ…
      </div>
    );
  return <TemperatureList readings={readings} pending={pending} onRemove={onRemove} />;
}
