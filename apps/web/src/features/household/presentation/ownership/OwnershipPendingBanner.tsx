import { OwnershipOfferActions } from './OwnershipOfferActions';
import type { OwnershipOffer } from '../../application/householdHomePorts';
import { HomeClayGlyph } from '../home/HomeClayGlyph';

type Props = {
  offer: OwnershipOffer;
  familyName: string;
  isRecipient: boolean;
  pending: boolean;
  onRevoke: (offerId: string) => void;
  onDecide: (offerId: string, accept: boolean) => void;
};

export function OwnershipPendingBanner({
  offer,
  familyName,
  isRecipient,
  pending,
  onRevoke,
  onDecide,
}: Props) {
  return (
    <div className="household-home-amber-banner" role="status">
      <div className="household-home-amber-copy">
        <span className="household-home-amber-icon" aria-hidden="true">
          <HomeClayGlyph name="home-clock" size={16} />
        </span>
        {isRecipient ? (
          <span>
            {offer.offeredBy.displayName} đề nghị bạn làm Chủ hộ {familyName}.
          </span>
        ) : (
          <span>
            Đã gửi đề nghị cho{' '}
            <strong className="household-home-amber-strong">{offer.target.displayName}</strong> · đang chờ trả
            lời
          </span>
        )}
      </div>
      <OwnershipOfferActions
        offerId={offer.id}
        isRecipient={isRecipient}
        pending={pending}
        onRevoke={onRevoke}
        onDecide={onDecide}
      />
    </div>
  );
}
