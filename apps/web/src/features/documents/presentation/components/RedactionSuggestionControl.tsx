import type { SuggestionStatus } from '../../application/requestRedactionSuggestions';

type Props = {
  status: SuggestionStatus;
  /** Lý do chưa bấm được (chưa chọn hồ sơ), null khi sẵn sàng. */
  blockedReason: string | null;
  onRun: () => void;
  onCancel: () => void;
};

const button =
  'flex min-h-11 items-center gap-1.5 rounded-xl bg-[#e4f0f0] px-3 text-xs font-semibold text-[#131d1d] transition-colors enabled:hover:bg-[#deebea] disabled:opacity-40';

function message(status: SuggestionStatus): string | null {
  if (status.kind === 'error')
    return status.reason === 'busy'
      ? 'Máy chủ đang bận tìm thông tin cá nhân trên ảnh khác. Bạn vẫn tự che được như bình thường.'
      : 'Chưa gợi ý được lúc này. Bạn vẫn tự che được như bình thường.';
  if (status.kind !== 'done') return null;
  if (!status.added && !status.dropped) return 'Không tìm thấy thông tin cá nhân. Hãy tự kiểm tra lại.';
  const added = `Đã thêm ${status.added} vùng che gợi ý. Hãy kiểm tra lại toàn ảnh, nhất là chữ ký tay và mã vạch.`;
  return status.dropped
    ? `${added} Còn ${status.dropped} vùng chưa thêm được vì đã đủ 32 vùng che. Hãy che phần còn lại bằng tay hoặc che cả khối.`
    : added;
}

// SPEC-083 / BR-085: gợi ý là tuỳ chọn; lỗi hay bận không chặn việc tự che.
export function RedactionSuggestionControl({ status, blockedReason, onRun, onCancel }: Props) {
  const loading = status.kind === 'loading';
  const text = message(status);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[#f3f8f7] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={button} disabled={loading || Boolean(blockedReason)} onClick={onRun}>
          {loading ? 'Đang tìm thông tin cá nhân… (khoảng 15 giây)' : 'Gợi ý vùng che'}
        </button>
        {loading && (
          <button type="button" className={button} onClick={onCancel}>
            Huỷ
          </button>
        )}
      </div>
      <p className="text-[13px] leading-5 text-[#404945]">
        {blockedReason ??
          'Ảnh sẽ được gửi tới máy chủ AN GIA để tìm thông tin cá nhân. Ảnh không được lưu và không gửi ra ngoài. Xoay ảnh cho đúng chiều trước khi gợi ý.'}
      </p>
      <p
        role="status"
        aria-live="polite"
        className="text-[13px] leading-5 font-medium text-[#131d1d] empty:hidden"
      >
        {text}
      </p>
    </div>
  );
}
