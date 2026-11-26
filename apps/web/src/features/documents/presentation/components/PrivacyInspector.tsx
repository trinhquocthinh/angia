import type { ReactNode } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
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
      className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-28"
    >
      <div className="doc-bento-card flex flex-col gap-4 p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/35 pb-3">
          <h3 className="auth-heading text-body font-bold text-accent">Công cụ điều chỉnh</h3>
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-caption text-text-secondary">
            Esc / Enter
          </span>
        </div>
        {fields}
        {inputPending && (
          <p role="status" className="rounded-xl bg-warning-soft p-3 text-caption font-medium text-warning">
            Hoàn tất vị trí vùng chọn hoặc nhấn Esc trước khi xem bản sẽ tải lên.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (!inputPending) onNext();
          }}
          disabled={inputPending || !preview}
          className="inline-flex min-h-btn w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors enabled:cursor-pointer enabled:hover:bg-accent-hover disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <PrivacyToolIcon name="eye" />
          Xem bản sẽ tải lên
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-btn w-full items-center justify-center rounded-2xl bg-surface-container px-4 text-button-secondary font-semibold text-text-primary transition-colors hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Để sau
        </button>
        <p className="flex items-start gap-2 rounded-2xl bg-accent-soft p-3 text-caption text-text-secondary">
          <span className="mt-0.5 text-accent">
            <AdminIcon name="shield" size={16} />
          </span>
          Vùng che đen được phủ lên ảnh ngay trên máy. AN GIA chỉ nhận bản đã che.
        </p>
      </div>
    </aside>
  );
}
