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
    <aside aria-label="Công cụ chỉnh sửa ảnh" className="flex min-w-0 flex-col gap-4 self-start">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#707975]">Công cụ điều chỉnh</h3>
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
          className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#004135] px-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#20594b] disabled:opacity-40"
        >
          <PrivacyToolIcon name="shield" />
          Xem bản sẽ tải lên
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-11 items-center justify-center rounded-xl bg-[#e4f0f0] px-3 py-2.5 text-sm font-semibold text-[#286958]"
        >
          Để sau
        </button>
        <p className="flex items-start gap-2 text-[11px] leading-4 text-[#707975]">
          <PrivacyToolIcon name="shield" />
          Vùng che đen được phủ lên ảnh ngay trên máy. AN GIA chỉ nhận bản đã che.
        </p>
      </div>
    </aside>
  );
}
