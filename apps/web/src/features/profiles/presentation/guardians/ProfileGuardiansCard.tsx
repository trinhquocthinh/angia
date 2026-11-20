import type { ProfileGuardian } from '../../application/guardianPorts';
import { MAX_PROFILE_GUARDIANS } from '../../application/guardianRules';
import { GuardianRow } from './GuardianRow';

type Props = {
  profileName: string;
  guardians: ProfileGuardian[];
  onOpenAdd: () => void;
  onOpenRemoveSelf: () => void;
};

export function ProfileGuardiansCard({ profileName, guardians, onOpenAdd, onOpenRemoveSelf }: Props) {
  const count = guardians.length;
  const isFull = count >= MAX_PROFILE_GUARDIANS;
  const isViewerGuardian = guardians.some((item) => item.isMe);

  return (
    <div className="profile-guardians-card">
      <div className="profile-guardians-head">
        <div className="profile-guardians-title-row">
          <h2 className="profile-guardians-title">Người giám hộ</h2>
          <span className={`profile-guardians-count${isFull ? ' profile-guardians-count-full' : ''}`}>
            {isFull ? '2/2 Đã đủ' : `${count}/2 người`}
          </span>
        </div>
        <p className="profile-guardians-desc">
          Người giám hộ nhận nhắc thuốc của {profileName}. Tối đa 2 người.
        </p>
      </div>
      <ul className="profile-guardians-list">
        {guardians.map((guardian) => (
          <GuardianRow key={guardian.accountId} guardian={guardian} onOpenRemoveSelf={onOpenRemoveSelf} />
        ))}
      </ul>
      {isViewerGuardian && (
        <div className="profile-guardians-footer">
          {isFull ? (
            <p className="profile-guardians-full-note">Đã đủ 2 người giám hộ.</p>
          ) : (
            <button
              type="button"
              className="profile-guardians-add-btn"
              onClick={(event) => {
                event.currentTarget.focus();
                onOpenAdd();
              }}
            >
              <img
                src="/images/household/stitch/guardian-plus.svg"
                width={18}
                height={18}
                alt=""
                aria-hidden="true"
              />
              <span>Thêm người giám hộ</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
