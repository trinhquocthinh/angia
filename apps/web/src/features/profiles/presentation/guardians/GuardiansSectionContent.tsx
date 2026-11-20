import type { ProfileGuardian } from '../../application/guardianPorts';
import { ProfileGuardiansCard } from './ProfileGuardiansCard';

export function GuardiansSectionContent(props: {
  profileName: string;
  guardians: ProfileGuardian[];
  isPending: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenAdd: () => void;
  onOpenRemoveSelf: () => void;
}) {
  if (props.isPending) {
    return <p className="rounded-xl bg-surface p-6 text-sm text-text-secondary">Đang tải người giám hộ…</p>;
  }
  if (props.errorMessage) {
    return (
      <p role="alert" className="rounded-xl bg-surface p-6 text-sm">
        {props.errorMessage}{' '}
        <button type="button" className="font-semibold text-accent underline" onClick={props.onRetry}>
          Thử lại
        </button>
      </p>
    );
  }
  return (
    <ProfileGuardiansCard
      profileName={props.profileName}
      guardians={props.guardians}
      onOpenAdd={props.onOpenAdd}
      onOpenRemoveSelf={props.onOpenRemoveSelf}
    />
  );
}
