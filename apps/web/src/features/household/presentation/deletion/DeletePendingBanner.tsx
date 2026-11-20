import { formatHouseholdDateTime } from '../../application/formatHouseholdDateTime';
import { useDeletionCountdown } from '../../application/useDeletionCountdown';
import type { DeletionRequest } from '../../application/householdHomePorts';
import { HomeClayGlyph } from '../home/HomeClayGlyph';

type Props = {
  request: DeletionRequest;
  pending: boolean;
  onRevoke: (requestId: string) => void;
};

export function DeletePendingBanner({ request, pending, onRevoke }: Props) {
  const executeTime = formatHouseholdDateTime(request.executeAt);
  const { remaining, expired } = useDeletionCountdown(request.executeAt);
  return (
    <div className="household-home-amber-banner" role="status">
      <div className="household-home-amber-copy">
        <span className="household-home-amber-icon" aria-hidden="true">
          <HomeClayGlyph name="home-clock" size={16} />
        </span>
        <span>
          Nhà sẽ bị xoá lúc <strong className="household-home-amber-strong">{executeTime}</strong> (còn{' '}
          {remaining})
        </span>
      </div>
      <button
        type="button"
        className="household-home-amber-btn"
        disabled={pending || expired}
        onClick={() => onRevoke(request.id)}
      >
        Thu hồi yêu cầu xoá
      </button>
    </div>
  );
}
