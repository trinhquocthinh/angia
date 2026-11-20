import type { ProfileGuardian } from '../../application/guardianPorts';
import { guardianInitials } from '../../application/guardianRules';

type Props = {
  guardian: ProfileGuardian;
  onOpenRemoveSelf: () => void;
};

export function GuardianRow({ guardian, onOpenRemoveSelf }: Props) {
  return (
    <li className="profile-guardian-row">
      <div className="profile-guardian-identity">
        <span className="profile-guardian-avatar" aria-hidden="true">
          {guardianInitials(guardian.displayName)}
        </span>
        <div className="profile-guardian-name-wrap">
          <span className="profile-guardian-name">{guardian.displayName}</span>
          {guardian.isMe && <span className="profile-guardian-me-chip">Bạn</span>}
        </div>
      </div>
      {guardian.isMe && (
        <button
          type="button"
          className="profile-guardian-remove-btn"
          onClick={(event) => {
            event.currentTarget.focus();
            onOpenRemoveSelf();
          }}
        >
          <img
            src="/images/household/stitch/home-logout-danger.svg"
            width={16}
            height={16}
            alt=""
            aria-hidden="true"
          />
          <span>Tự gỡ</span>
        </button>
      )}
    </li>
  );
}
