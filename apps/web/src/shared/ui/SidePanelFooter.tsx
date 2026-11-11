import { Button } from './button/Button';

// Chân side panel dính đáy vùng cuộn: nút chính 56px, nút phụ tối thiểu 48px.
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
        <Button type={submit ? 'submit' : 'button'} disabled={disabled}>
          {submitLabel}
        </Button>
      )}
      <Button variant="secondary" type="button" disabled={cancelDisabled} onClick={onCancel}>
        {cancelLabel}
      </Button>
    </div>
  );
}
