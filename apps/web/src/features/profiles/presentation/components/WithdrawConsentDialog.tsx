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
        <h2 id="withdraw-consent-title" className="auth-heading text-2xl font-semibold text-[#912018]">
          Rút đồng thuận
        </h2>
        <p className="text-sm leading-6 text-[#55615f]">
          Sau khi rút, AN GIA ngừng lưu thêm, ngừng nhắc thuốc và ẩn thông tin sức khỏe của hồ sơ{' '}
          <strong className="break-words text-[#131d1d]">{name}</strong> với mọi người trong gia đình. Dữ liệu
          đã lưu chưa bị xóa; muốn xóa hẳn, hãy nhờ người quản lý gia đình xóa hồ sơ.
        </p>
        {failure && (
          <p role="alert" className="text-sm font-medium text-[#b42318]">
            {failure}
          </p>
        )}
        <button
          type="button"
          disabled={pending}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#b42318] px-5 py-3 text-[17px] font-semibold text-white cursor-pointer hover:bg-[#912018] disabled:bg-[#e4e0da] disabled:text-[#55615f] disabled:cursor-default"
          onClick={onConfirm}
        >
          Rút đồng thuận
        </button>
        <button
          type="button"
          disabled={pending}
          className="min-h-[52px] rounded-xl px-5 text-sm font-semibold text-[#004135] cursor-pointer disabled:opacity-55"
          onClick={onCancel}
        >
          Giữ nguyên
        </button>
      </div>
    </ModalDialog>
  );
}
