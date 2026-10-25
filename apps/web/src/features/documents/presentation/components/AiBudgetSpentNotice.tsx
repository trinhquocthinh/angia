// SPEC-031: gia đình đã dùng hết trần đọc tự động tháng này — không gửi AI ngay; chọn nhập tay hoặc xếp hàng chờ
// (chứng từ chờ ngân sách, tự đọc đầu tháng sau hoặc khi quản trị viên nâng trần).
export function AiBudgetSpentNotice({
  busy,
  queueDisabled = false,
  onManual,
  onQueue,
}: {
  busy: boolean;
  /** Xếp hàng vẫn là xác nhận ảnh: cần đã tải bản kiểm tra và tích ô xác nhận. */
  queueDisabled?: boolean;
  onManual: () => void;
  onQueue: () => void;
}) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-xl bg-[#fff4e5] p-3 text-sm text-[#5c3b00]">
      <p className="m-0">Đã dùng 100% lượt đọc tự động tháng này.</p>
      <p className="m-0">
        Bạn có thể nhập tay ngay, hoặc xếp hàng chờ để ảnh được đọc tự động vào đầu tháng sau hay khi quản trị
        viên nâng hạn mức.
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
