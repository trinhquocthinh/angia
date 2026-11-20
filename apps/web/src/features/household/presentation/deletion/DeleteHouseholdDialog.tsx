import { useId, useState } from 'react';
import { HomeDialogShell } from '../home/HomeDialogShell';
import { DeleteHouseholdInfoList } from './DeleteHouseholdInfoList';

type Props = {
  familyName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (confirmFamilyName: string) => void;
};

export function DeleteHouseholdDialog({ familyName, pending, error, onClose, onConfirm }: Props) {
  const inputId = useId();
  const [confirmName, setConfirmName] = useState('');
  const matched = confirmName.trim() === familyName;

  return (
    <HomeDialogShell
      iconName="home-delete-shield"
      title={`Xoá ${familyName}?`}
      closeLabel="Đóng hộp thoại xoá nhà"
      confirmLabel={pending ? 'Đang gửi…' : 'Xoá nhà'}
      confirmDisabled={pending || !matched}
      pending={pending}
      onClose={onClose}
      onConfirm={() => onConfirm(confirmName.trim())}
    >
      <DeleteHouseholdInfoList />
      <div className="household-delete-confirm-field">
        <label htmlFor={inputId}>Gõ tên nhà để xác nhận</label>
        <input
          id={inputId}
          type="text"
          value={confirmName}
          placeholder={familyName}
          disabled={pending}
          onChange={(event) => setConfirmName(event.target.value)}
        />
        <span className="household-delete-confirm-hint">
          Vui lòng nhập chính xác &quot;{familyName}&quot; để kích hoạt nút xoá.
        </span>
      </div>
      {error && (
        <p role="alert" className="household-home-error-alert">
          {error}
        </p>
      )}
    </HomeDialogShell>
  );
}
