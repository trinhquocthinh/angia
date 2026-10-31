import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { ModalHeader } from '@src/shared/ui/ModalHeader';
import type { LinkableAccount, ProfileRequest, ProfileSession } from '../../application/ports';
import { NewProfileForm } from './NewProfileForm';

type Props = {
  session: ProfileSession;
  accounts: LinkableAccount[];
  accountsLoading: boolean;
  accountsError: boolean;
  retry: () => void;
  pending: boolean;
  onSave: (body: ProfileRequest) => Promise<unknown>;
  onClose: () => void;
};

// Tạo hồ sơ: modal giữa màn hình ở desktop, bottom sheet ở mobile (ModalDialog).
export function NewProfileDialog({ session, pending, onClose, ...form }: Props) {
  const familyName = session.family?.name;
  return (
    <ModalDialog labelledBy="new-profile-title" onCancel={onClose} pending={pending} width="md">
      <ModalHeader
        titleId="new-profile-title"
        tone="accent"
        icon={<AdminIcon name="person_add" />}
        title="Tạo hồ sơ thành viên mới"
        subtitle={`Thêm thông tin người thân vào sổ ${familyName ? `của ${familyName}` : 'sức khỏe gia đình'}`}
        closeLabel="Đóng"
        pending={pending}
        onClose={onClose}
      />
      {session.role === 'main' ? (
        <NewProfileForm
          key={`${session.account.id}:${session.family?.id ?? ''}`}
          currentAccountId={session.account.id}
          pending={pending}
          {...form}
        />
      ) : (
        <p role="alert" className="px-6 pb-6 text-sm leading-6 max-md:px-5">
          Chỉ người chăm sóc chính có thể tạo hồ sơ sức khỏe.
        </p>
      )}
    </ModalDialog>
  );
}
