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
      <div className="flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-sm lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Công cụ điều chỉnh</h3>
          <span className="text-[11px] text-text-secondary">Phím tắt: Esc / Enter</span>
        </div>
        {fields}
        {inputPending && (
          <p role="status" className="text-xs leading-5 text-warning">
            Hoàn tất vị trí vùng chọn hoặc nhấn Esc trước khi xem bản sẽ tải lên.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (!inputPending) onNext();
          }}
          disabled={inputPending || !preview}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent shadow-sm transition-colors enabled:hover:bg-accent-hover disabled:opacity-40"
        >
          <PrivacyToolIcon name="eye" />
          Xem bản sẽ tải lên
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-11 items-center justify-center rounded-xl bg-accent-soft px-3 text-xs font-semibold text-text-primary transition-colors hover:bg-border"
        >
          Để sau
        </button>
        <p className="flex items-start gap-2 rounded-xl bg-accent-soft p-2.5 text-[11px] leading-4 text-text-secondary">
          <span className="text-accent">
            <PrivacyToolIcon name="shield" />
          </span>
          Vùng che đen được phủ lên ảnh ngay trên máy. AN GIA chỉ nhận bản đã che.
        </p>
      </div>
    </aside>
  );
}
