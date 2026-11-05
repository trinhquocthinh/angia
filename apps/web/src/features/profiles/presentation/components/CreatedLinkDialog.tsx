import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { ModalHeader } from '@src/shared/ui/ModalHeader';
import type { InvitationCreated } from '../../application/invitationPorts';
import { InvitationCopyField } from './InvitationCopyField';
// SPEC-004 (E14): hồ sơ vừa tạo kèm tài khoản khác; hồ sơ chỉ gắn khi người đó tự xác nhận qua link.
export function CreatedLinkDialog({ created, onClose }: { created: InvitationCreated; onClose: () => void }) {
  return (
    <ModalDialog labelledBy="created-link-title" onCancel={onClose} pending={false} width="md">
      <ModalHeader
        titleId="created-link-title"
        tone="accent"
        icon={<AdminIcon name="person_add" />}
        title="Đã tạo hồ sơ"
        subtitle="Gửi link này cho chính người có tài khoản bạn đã chọn"
        closeLabel="Đóng"
        pending={false}
        onClose={onClose}
      />
      <div className="border-t border-[#e4f0f0] px-6 pb-6 max-md:px-5">
        <InvitationCopyField created={created} />
        <p className="mt-3 text-xs leading-5 text-[#55615f]">
          Hãy sao chép trước khi đóng; link không được lưu để đọc lại. Nếu mất link, bạn tạo link mới từ thẻ
          hồ sơ trên Trang chủ.
        </p>
      </div>
    </ModalDialog>
  );
}
