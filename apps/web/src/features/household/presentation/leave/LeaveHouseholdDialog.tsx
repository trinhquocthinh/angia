import { useState } from 'react';
import type { OwnProfileDisposition } from '../../application/householdHomePorts';
import { HomeDialogShell } from '../home/HomeDialogShell';
import { LeaveDispositionOptions } from './LeaveDispositionOptions';
import { LeaveErrorNotice } from './LeaveErrorNotice';

type Props = {
  familyName: string;
  pending: boolean;
  error: string | null;
  errorCode: string | null;
  onClose: () => void;
  onConfirm: (disposition: OwnProfileDisposition) => void;
  onGoToDelete: () => void;
};

export function LeaveHouseholdDialog(props: Props) {
  const { familyName, pending, error, errorCode } = props;
  const [disposition, setDisposition] = useState<OwnProfileDisposition>('keep');
  const [confirmedDelete, setConfirmedDelete] = useState(false);
  const canSubmit = !pending && (disposition === 'keep' || confirmedDelete);

  return (
    <HomeDialogShell
      iconName="home-logout-danger"
      title={`Rời ${familyName}?`}
      closeLabel="Đóng hộp thoại rời nhà"
      confirmLabel={pending ? 'Đang xử lý…' : 'Rời nhà'}
      confirmDisabled={!canSubmit}
      pending={pending}
      onClose={props.onClose}
      onConfirm={() => props.onConfirm(disposition)}
    >
      <LeaveDispositionOptions
        disposition={disposition}
        pending={pending}
        onChange={(value) => {
          setDisposition(value);
          if (value === 'keep') setConfirmedDelete(false);
        }}
      />
      {disposition === 'delete' && (
        <label className="household-leave-confirm-check">
          <input
            type="checkbox"
            checked={confirmedDelete}
            disabled={pending}
            onChange={(event) => setConfirmedDelete(event.target.checked)}
          />
          <span>Tôi hiểu hồ sơ của tôi sẽ bị xoá hẳn và không thể phục hồi lại.</span>
        </label>
      )}
      <p className="household-leave-privacy-note">
        Sau khi rời, bạn không còn thấy dữ liệu của nhà và không còn nhận thông báo của nhà này.
      </p>
      {error && <LeaveErrorNotice error={error} errorCode={errorCode} onGoToDelete={props.onGoToDelete} />}
    </HomeDialogShell>
  );
}
