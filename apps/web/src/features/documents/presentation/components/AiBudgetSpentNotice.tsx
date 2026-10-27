import type { FamilyUsage } from '@angia/contracts';
const messages = {
  scan_quota_exhausted: 'Gia đình chưa có lượt nhận diện khả dụng trong tháng này.',
  budget_exhausted: 'Hệ thống tạm hết ngân sách nhận diện ảnh.',
  billing_unavailable: 'Hệ thống đang xác nhận dữ liệu phí, tạm dừng nhận diện ảnh.',
};
export function AiBudgetSpentNotice({
  busy,
  reason = 'scan_quota_exhausted',
  queueDisabled = false,
  onManual,
  onQueue,
}: {
  busy: boolean;
  reason?: FamilyUsage['aiOcr']['reason'];
  /** Xếp hàng vẫn là xác nhận ảnh: cần đã tải bản kiểm tra và tích ô xác nhận. */
  queueDisabled?: boolean;
  onManual: () => void;
  onQueue: () => void;
}) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-xl bg-[#fff4e5] p-3 text-sm text-[#5c3b00]">
      <p className="m-0">{messages[reason]}</p>
      <p className="m-0">
        Bạn có thể nhập tay ngay, hoặc xếp hàng chờ. Ảnh chỉ được nhận diện khi quản trị viên cấp đủ lượt và
        ngân sách hệ thống đã được xác nhận còn khả dụng. Lượt không tự gia hạn.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onManual}
          className="min-h-11 rounded-xl bg-[#286958] px-4 font-semibold text-white disabled:opacity-40"
        >
          Nhập tay ngay
        </button>
        <button
          type="button"
          disabled={busy || queueDisabled}
          onClick={onQueue}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135] shadow-sm disabled:opacity-40"
        >
          Xếp hàng chờ
        </button>
      </div>
    </div>
  );
}
