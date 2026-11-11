// Chân side panel dính đáy vùng cuộn: nút chính 52px + nút phụ đóng (Stitch f29c92d0).
type Props = {
  /** null: không có nút chính (đã lưu xong, hoặc không có gì để gửi). */
  submitLabel: string | null;
  cancelLabel: string;
  disabled: boolean;
  /** Nút chính là submit của form chứa nó; false thì là nút thường (khi chưa có form để gửi). */
  submit: boolean;
  cancelDisabled: boolean;
  onCancel: () => void;
};

export function SidePanelFooter({
  submitLabel,
  cancelLabel,
  disabled,
  submit,
  cancelDisabled,
  onCancel,
}: Props) {
  return (
    <div className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t border-border bg-surface-raised px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {submitLabel && (
        <button
          type={submit ? 'submit' : 'button'}
          disabled={disabled}
          className="min-h-[52px] rounded-xl bg-accent px-4 text-[15px] font-semibold text-on-accent shadow-[0_4px_14px_color-mix(in_srgb,var(--color-shadow)_18%,transparent)] hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {submitLabel}
        </button>
      )}
      <button
        type="button"
        disabled={cancelDisabled}
        onClick={onCancel}
        className="min-h-11 rounded-xl px-4 text-sm font-medium text-text-secondary hover:bg-accent-soft hover:text-text-primary disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
