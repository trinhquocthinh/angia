type Props = {
  offerId: string;
  isRecipient: boolean;
  pending: boolean;
  onRevoke: (id: string) => void;
  onDecide: (id: string, accept: boolean) => void;
};
export function OwnershipOfferActions({ offerId, isRecipient, pending, onRevoke, onDecide }: Props) {
  return (
    <div className="household-home-amber-actions">
      {isRecipient ? (
        <>
          <button
            type="button"
            className="household-ownership-accept-btn"
            disabled={pending}
            onClick={() => onDecide(offerId, true)}
          >
            Chấp nhận
          </button>
          <button
            type="button"
            className="household-home-amber-btn"
            disabled={pending}
            onClick={() => onDecide(offerId, false)}
          >
            Từ chối
          </button>
        </>
      ) : (
        <button
          type="button"
          className="household-home-amber-btn"
          disabled={pending}
          onClick={() => onRevoke(offerId)}
        >
          Thu hồi đề nghị
        </button>
      )}
    </div>
  );
}
