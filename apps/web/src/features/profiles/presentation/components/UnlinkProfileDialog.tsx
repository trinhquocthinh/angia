import { ModalDialog } from '@src/shared/ui/ModalDialog';
// SPEC-050: gỡ không xóa dữ liệu, không đổi đồng thuận; hồ sơ chỉ có người nhận nhắc khi được chỉ định lại.
export function UnlinkProfileDialog({
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
      labelledBy="unlink-profile-title"
      role="alertdialog"
      onCancel={onCancel}
      pending={pending}
      width="md"
    >
      <div className="flex flex-col gap-5 p-6">
        <h2 id="unlink-profile-title" className="auth-heading text-2xl font-semibold text-danger">
          Gỡ liên kết
        </h2>
        <p className="text-sm leading-6 text-text-secondary">
          Hồ sơ <strong className="break-words text-text-primary">{name}</strong> sẽ không còn gắn với tài
          khoản của bạn và bạn không còn nhận nhắc thuốc của hồ sơ này. Dữ liệu sức khỏe đã lưu được giữ
          nguyên.
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
          Gỡ liên kết
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
