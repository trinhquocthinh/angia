import type { SuggestionStatus } from '../../application/requestRedactionSuggestions';

export type ProfileOption = { id: string; displayName: string };
type Props = {
  /** Kết quả useRedactionSuggestions. */
  suggestions: { status: SuggestionStatus; run: () => void; cancel: () => void };
  /** Hồ sơ đã đồng thuận để chọn ngay tại chỗ khi chưa có hồ sơ nhận ảnh; null khi đã có. */
  choices: ProfileOption[] | null;
  onChooseProfile: (id: string) => void;
};

const button =
  'flex min-h-11 items-center gap-1.5 rounded-xl bg-accent-soft px-3 text-xs font-semibold text-text-primary transition-colors enabled:hover:bg-border disabled:opacity-40';

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

// API kiểm đồng thuận theo hồ sơ: chưa có hồ sơ nhận ảnh thì cho chọn ngay tại đây (cùng hồ sơ dùng khi tải lên).
function ProfilePicker({ choices, onChoose }: { choices: ProfileOption[]; onChoose: (id: string) => void }) {
  if (!choices.length)
    return (
      <span className="text-xs text-text-secondary">
        Chưa có hồ sơ nào đã đồng thuận nên chưa gợi ý được.
      </span>
    );
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-text-primary">
      Hồ sơ nhận ảnh
      <select
        className="min-h-11 rounded-xl border border-border bg-surface px-2 text-sm"
        defaultValue=""
        onChange={(event) => event.target.value && onChoose(event.target.value)}
      >
        <option value="" disabled>
          Chọn hồ sơ…
        </option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

// SPEC-083 / BR-085: gợi ý là tuỳ chọn; lỗi hay bận không chặn việc tự che.
export function RedactionSuggestionControl({ suggestions, choices, onChooseProfile }: Props) {
  const { status, run: onRun, cancel: onCancel } = suggestions;
  const loading = status.kind === 'loading';
  const text = message(status);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        {choices && <ProfilePicker choices={choices} onChoose={onChooseProfile} />}
        <button type="button" className={button} disabled={loading || Boolean(choices)} onClick={onRun}>
          {loading ? 'Đang tìm thông tin cá nhân… (khoảng 15 giây)' : 'Gợi ý vùng che'}
        </button>
        {loading && (
          <button type="button" className={button} onClick={onCancel}>
            Huỷ
          </button>
        )}
      </div>
      <p className="text-[13px] leading-5 text-text-secondary">
        Ảnh sẽ được gửi tới máy chủ AN GIA để tìm thông tin cá nhân. Ảnh không được lưu và không gửi ra ngoài.
        Xoay ảnh cho đúng chiều trước khi gợi ý.
      </p>
      <p
        role="status"
        aria-live="polite"
        className="text-[13px] leading-5 font-medium text-text-primary empty:hidden"
      >
        {text}
      </p>
    </div>
  );
}
