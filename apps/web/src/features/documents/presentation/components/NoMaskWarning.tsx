import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { ModalHeader } from '@src/shared/ui/ModalHeader';
import { revealStyle } from '@src/shared/ui/revealStyle';
import { DocumentIcon } from './DocumentIcon';

type NoMaskWarningProps = { busy: boolean; onBack: () => void; onSendAnyway: () => void };

// BR-041 bổ sung 2026-10-12, D5: ảnh không có vùng che nào thì hỏi lại trước khi tải lên.
// Hộp thoại theo Stitch 369b16ad (mobile: bottom sheet 4f573bdf); lời lẽ trung tính, không hù doạ,
// không tuyên bố hệ thống tự phát hiện định danh. Escape/nút đóng = quay lại che.
export function NoMaskWarning({ busy, onBack, onSendAnyway }: NoMaskWarningProps) {
  return (
    <ModalDialog labelledBy="no-mask-title" role="alertdialog" onCancel={onBack} pending={busy} width="md">
      <ModalHeader
        titleId="no-mask-title"
        tone="warning"
        icon={<DocumentIcon name="lock" size={22} />}
        eyebrow="Kiểm tra riêng tư"
        title="Ảnh chưa có vùng che nào"
        closeLabel="Đóng và quay lại che thông tin"
        pending={busy}
        onClose={onBack}
      />
      <div className="flex flex-col gap-5 overflow-y-auto px-6 pb-6 max-md:px-5 max-md:pb-[max(20px,env(safe-area-inset-bottom))]">
        <p
          className="angia-modal-reveal flex gap-3 rounded-2xl bg-[#fff1ea] p-4 text-[15px] leading-6 text-[#321200]"
          style={revealStyle(0)}
        >
          <span className="mt-0.5 text-[#833b00]">
            <DocumentIcon name="warning" size={20} />
          </span>
          <span>
            Nếu trên ảnh còn{' '}
            <strong className="font-semibold underline decoration-[#ffb68c] decoration-2 underline-offset-4">
              họ tên, ngày sinh, địa chỉ, số điện thoại, mã bệnh nhân hoặc số bảo hiểm y tế
            </strong>
            , hãy che trước khi tải lên.
          </span>
        </p>
        <div className="angia-modal-reveal grid gap-3 sm:grid-cols-2" style={revealStyle(1)}>
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onBack}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#20594b] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_#20594b33] transition-[background-color,transform] duration-200 hover:bg-[#004135] active:scale-[0.98] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <span className="-scale-x-100">
              <DocumentIcon name="arrow" size={18} />
            </span>
            Quay lại che
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSendAnyway}
            className="min-h-12 rounded-xl border border-[#ffb68c] bg-[#fff6f1] px-4 text-sm font-semibold text-[#602900] transition-colors duration-200 hover:bg-[#ffdbc9] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602900] motion-reduce:transition-none"
          >
            Ảnh không có thông tin cá nhân — vẫn tải lên
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
