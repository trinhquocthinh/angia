import type { ReactNode } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { ModalHeader } from '@src/shared/ui/ModalHeader';
import { DocumentIcon } from './DocumentIcon';

type Props = { busy: boolean; onClose: () => void; image: ReactNode; controls: ReactNode };

// Bản kiểm tra trong hộp thoại (desktop giữa màn hình, mobile bottom sheet) để ảnh và nút xác nhận
// cùng nằm trong một khung nhìn, không phải cuộn trang. Escape/đóng = quay lại chỉnh ảnh.
export function PrivacyReviewDialog({ busy, onClose, image, controls }: Props) {
  return (
    <ModalDialog labelledBy="privacy-review-title" onCancel={onClose} pending={busy} width="xl">
      <ModalHeader
        titleId="privacy-review-title"
        tone="accent"
        icon={<DocumentIcon name="lock" size={22} />}
        title="Kiểm tra ảnh trước khi gửi"
        subtitle="Ảnh này sẽ gửi để tự động nhận diện. Kiểm tra họ tên, địa chỉ và thông tin định danh đã được che."
        closeLabel="Đóng để chỉnh lại ảnh"
        pending={busy}
        onClose={onClose}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pb-4 max-md:px-5">{image}</div>
      <div className="flex shrink-0 flex-col gap-3 border-t border-[#e4f0f0] bg-white px-6 py-4 max-md:px-5 max-md:pb-[max(16px,env(safe-area-inset-bottom))]">
        {controls}
      </div>
    </ModalDialog>
  );
}
