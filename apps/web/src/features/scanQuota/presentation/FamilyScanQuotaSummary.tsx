import type { FamilyScanQuota } from '@angia/contracts';

const STATUS_LABELS = { default: 'Lượt mặc định', trial: 'Lượt dùng thử', approved: 'Đã duyệt' };

// Dòng thông tin lượt trong thẻ mức sử dụng; số đã dùng nằm ở thanh tiến độ phía trên nên không lặp lại.
export function FamilyScanQuotaSummary({
  quota,
  loading,
  error,
  onRetry,
}: {
  quota: FamilyScanQuota | null;
  loading: boolean;
  error: boolean;
  onRetry(): void;
}) {
  if (loading) return <p role="status">Đang tải hạn mức lượt…</p>;
  if (error)
    return (
      <p role="alert" className="flex flex-wrap items-center gap-x-2">
        Không thể tải hạn mức lượt.
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 cursor-pointer font-semibold text-[#286958] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          Thử lại
        </button>
      </p>
    );
  if (!quota) return <p>Chưa xác định hạn mức lượt.</p>;
  if (quota.status === 'unconfigured') return <p>Chưa cấp lượt tháng này.</p>;
  return (
    <p>
      <span className="font-semibold text-[#20594b]">Còn lại {quota.remainingScans} lượt</span>
      {` · Đang giữ ${quota.heldScans} lượt · ${STATUS_LABELS[quota.status]}`}
    </p>
  );
}
