import type { HouseholdMember } from '../../application/memberPorts';
import { HomeClayGlyph } from '../home/HomeClayGlyph';
import { OwnershipCandidateOption } from './OwnershipCandidateOption';

type Props = {
  coManagers: HouseholdMember[];
  selectedId: string;
  hasPendingOffer: boolean;
  pending: boolean;
  onSelect: (accountId: string) => void;
  onSend: (targetAccountId: string) => void;
};

export function OwnershipCandidateList({
  coManagers,
  selectedId,
  hasPendingOffer,
  pending,
  onSelect,
  onSend,
}: Props) {
  return (
    <>
      {coManagers.length > 0 ? (
        <div className="household-ownership-options" role="radiogroup" aria-label="Chọn Đồng quản lý">
          {coManagers.map((member) => (
            <OwnershipCandidateOption
              key={member.accountId}
              member={member}
              selected={selectedId === member.accountId}
              disabled={pending || hasPendingOffer}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <p className="household-ownership-empty">Chưa có Đồng quản lý. Đổi vai trò một thành viên trước.</p>
      )}
      <button
        type="button"
        className="household-ownership-submit-btn"
        disabled={pending || !selectedId || hasPendingOffer}
        onClick={() => selectedId && onSend(selectedId)}
      >
        <HomeClayGlyph name="home-send" size={22} />
        <span>{pending ? 'Đang gửi đề nghị…' : 'Gửi đề nghị'}</span>
      </button>
    </>
  );
}
