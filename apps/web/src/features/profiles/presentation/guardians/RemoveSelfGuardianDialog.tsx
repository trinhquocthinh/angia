import { GuardianDialogShell } from './GuardianDialogShell';

type Props = {
  profileName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemoveSelfGuardianDialog({ profileName, pending, error, onClose, onConfirm }: Props) {
  return (
    <GuardianDialogShell
      title={`Bạn không còn là người giám hộ của ${profileName}?`}
      closeLabel="Đóng hộp thoại xác nhận tự gỡ"
      pending={pending}
      error={error}
      confirmLabel={pending ? 'Đang gỡ…' : 'Tự gỡ'}
      confirmTone="danger"
      confirmDisabled={pending}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <p className="profile-guardian-dialog-desc">Bạn sẽ không còn nhận nhắc thuốc của {profileName}.</p>
    </GuardianDialogShell>
  );
}
