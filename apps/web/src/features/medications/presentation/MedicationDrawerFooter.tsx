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

export function MedicationDrawerFooter({
  submitLabel,
  cancelLabel,
  disabled,
  submit,
  cancelDisabled,
  onCancel,
}: Props) {
  return (
    <div className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t border-[#d9e5e4] bg-white px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {submitLabel && (
        <button
          type={submit ? 'submit' : 'button'}
          disabled={disabled}
          className="min-h-[52px] rounded-xl bg-[#004135] px-4 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(32,89,75,0.18)] hover:bg-[#163e34] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          {submitLabel}
        </button>
      )}
      <button
        type="button"
        disabled={cancelDisabled}
        onClick={onCancel}
        className="min-h-11 rounded-xl px-4 text-sm font-medium text-[#55615f] hover:bg-[#eaf6f5] hover:text-[#131d1d] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
