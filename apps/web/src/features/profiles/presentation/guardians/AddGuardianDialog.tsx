import { useState } from 'react';
import type { GuardianCandidate } from '../../application/guardianPorts';
import { AddGuardianCandidateList } from './AddGuardianCandidateList';
import { GuardianDialogShell } from './GuardianDialogShell';

type Props = {
  profileName: string;
  candidates: GuardianCandidate[];
  loading: boolean;
  loadError: boolean;
  pending: boolean;
  submitError: string | null;
  onRetryLoad: () => void;
  onClose: () => void;
  onSubmit: (accountId: string) => void;
};

export function AddGuardianDialog(props: Props) {
  const [selectedId, setSelectedId] = useState('');

  return (
    <GuardianDialogShell
      title={`Thêm người giám hộ cho ${props.profileName}`}
      closeLabel="Đóng hộp thoại thêm người giám hộ"
      pending={props.pending}
      error={props.submitError}
      confirmLabel={props.pending ? 'Đang thêm…' : 'Thêm'}
      confirmTone="primary"
      confirmDisabled={props.pending || !selectedId}
      onClose={props.onClose}
      onConfirm={() => selectedId && props.onSubmit(selectedId)}
    >
      <AddGuardianCandidateList
        candidates={props.candidates}
        loading={props.loading}
        loadError={props.loadError}
        selectedId={selectedId}
        disabled={props.pending}
        onSelect={setSelectedId}
        onRetryLoad={props.onRetryLoad}
      />
    </GuardianDialogShell>
  );
}
