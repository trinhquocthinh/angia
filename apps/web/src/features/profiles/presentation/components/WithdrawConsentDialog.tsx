import { ModalDialog } from '@src/shared/ui/ModalDialog';
// Spec F07 §4.6: nguyên văn câu xác nhận; nút đỏ như hộp thoại xóa hồ sơ.
export function WithdrawConsentDialog({
  name,
  pending,
  failure,
  onConfirm,
  onCancel,
}: {
  name: string;
  pending: boolean;
  failure: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalDialog
      labelledBy="withdraw-consent-title"
      role="alertdialog"
      onCancel={onCancel}
      pending={pending}
      width="md"
    >
      <div className="flex flex-col gap-5 p-6">
        <h2 id="withdraw-consent-title" className="auth-heading text-2xl font-semibold text-danger">
          Rút đồng thuận
        </h2>
        <p className="text-sm leading-6 text-text-secondary">
          Sau khi rút, AN GIA ngừng lưu thêm, ngừng nhắc thuốc và ẩn thông tin sức khỏe của hồ sơ{' '}
          <strong className="break-words text-text-primary">{name}</strong> với mọi người trong gia đình. Dữ
          liệu đã lưu chưa bị xóa; muốn xóa hẳn, hãy nhờ người quản lý gia đình xóa hồ sơ.
        </p>
        {failure && (
          <p role="alert" className="text-sm font-medium text-danger">
            {failure}
          </p>
        )}
        <button
          type="button"
          disabled={pending}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-danger px-5 py-3 text-[17px] font-semibold text-on-accent cursor-pointer hover:bg-danger disabled:bg-border disabled:text-text-secondary disabled:cursor-default"
          onClick={onConfirm}
        >
          Rút đồng thuận
        </button>
        <button
          type="button"
          disabled={pending}
          className="min-h-[52px] rounded-xl px-5 text-sm font-semibold text-accent cursor-pointer disabled:opacity-55"
          onClick={onCancel}
        >
          Giữ nguyên
        </button>
      </div>
    </ModalDialog>
  );
}
