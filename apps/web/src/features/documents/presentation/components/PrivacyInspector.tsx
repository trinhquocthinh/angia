import type { ReactNode } from 'react';
import { PrivacyToolIcon } from './PrivacyToolIcon';
type Props = {
  preview: boolean;
  inputPending: boolean;
  fields: ReactNode;
  onNext: () => void;
  onCancel: () => void;
};
export function PrivacyInspector({ preview, inputPending, fields, onNext, onCancel }: Props) {
  return (
    <aside
      aria-label="Công cụ chỉnh sửa ảnh"
      className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-20"
    >
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#bfc9c4]/30 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#286958]">Công cụ điều chỉnh</h3>
          <span className="text-[11px] text-[#55615f]">Phím tắt: Esc / Enter</span>
        </div>
        {fields}
        {inputPending && (
          <p role="status" className="text-xs leading-5 text-[#9b472c]">
            Hoàn tất vị trí vùng chọn hoặc nhấn Esc trước khi xem bản sẽ tải lên.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (!inputPending) onNext();
          }}
          disabled={inputPending || !preview}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#004135] px-4 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-[#20594b] disabled:opacity-40"
        >
          <PrivacyToolIcon name="eye" />
          Xem bản sẽ tải lên
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-11 items-center justify-center rounded-xl bg-[#e4f0f0] px-3 text-xs font-semibold text-[#131d1d] transition-colors hover:bg-[#deebea]"
        >
          Để sau
        </button>
        <p className="flex items-start gap-2 rounded-xl bg-[#eaf6f5] p-2.5 text-[11px] leading-4 text-[#404945]">
          <span className="text-[#286958]">
            <PrivacyToolIcon name="shield" />
          </span>
          Vùng che đen được phủ lên ảnh ngay trên máy. AN GIA chỉ nhận bản đã che.
        </p>
      </div>
    </aside>
  );
}
