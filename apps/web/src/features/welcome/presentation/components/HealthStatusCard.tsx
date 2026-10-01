import type { SystemHealth } from '../../domain/SystemHealth';

type HealthStatusCardProps = {
  isLoading: boolean;
  isUnreachable: boolean;
  health: SystemHealth | undefined;
};

const dependencyLabel = (status: 'ok' | 'down') => (status === 'ok' ? 'Hoạt động' : 'Mất kết nối');

export function HealthStatusCard({ isLoading, isUnreachable, health }: HealthStatusCardProps) {
  if (isLoading) {
    return <p className="text-text-secondary">Đang kiểm tra hệ thống…</p>;
  }
  if (isUnreachable || !health) {
    return <p className="text-danger">Không kết nối được máy chủ.</p>;
  }

  return (
    <dl className="grid w-full grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 text-left">
      <dt className="text-text-secondary">Cơ sở dữ liệu</dt>
      <dd className="text-right font-medium">{dependencyLabel(health.db)}</dd>
      <dt className="text-text-secondary">Lưu trữ ảnh</dt>
      <dd className="text-right font-medium">{dependencyLabel(health.storage)}</dd>
    </dl>
  );
}
