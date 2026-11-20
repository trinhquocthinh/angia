import type { DeletionRequest, OwnershipOffer } from '../../application/householdHomePorts';
import { DeletePendingBanner } from '../deletion/DeletePendingBanner';
import { OwnershipPendingBanner } from '../ownership/OwnershipPendingBanner';

type Props = {
  familyName: string;
  isOwner: boolean;
  selfAccountId: string;
  pendingOffer: OwnershipOffer | null;
  pendingDeletion: DeletionRequest | null;
  ownershipPending: boolean;
  ownershipError: string | null;
  deletionPending: boolean;
  onRevokeOffer: (offerId: string) => void;
  onDecideOffer: (offerId: string, accept: boolean) => void;
  onRevokeDeletion: (requestId: string) => void;
};

export function HouseholdHomeBanners({
  familyName,
  isOwner,
  selfAccountId,
  pendingOffer,
  pendingDeletion,
  ownershipPending,
  ownershipError,
  deletionPending,
  onRevokeOffer,
  onDecideOffer,
  onRevokeDeletion,
}: Props) {
  const isRecipient = Boolean(pendingOffer && pendingOffer.target.accountId === selfAccountId);
  const showOffer = Boolean(pendingOffer && (isOwner || isRecipient));
  const showDeletion = Boolean(isOwner && pendingDeletion);
  const showRecipientError = Boolean(!isOwner && isRecipient && ownershipError);

  if (!showOffer && !showDeletion && !showRecipientError) return null;

  return (
    <div className="household-home-banners">
      {showOffer && pendingOffer && (
        <OwnershipPendingBanner
          offer={pendingOffer}
          familyName={familyName}
          isRecipient={isRecipient}
          pending={ownershipPending}
          onRevoke={onRevokeOffer}
          onDecide={onDecideOffer}
        />
      )}
      {showRecipientError && (
        <p role="alert" className="household-home-error-alert">
          {ownershipError}
        </p>
      )}
      {showDeletion && pendingDeletion && (
        <DeletePendingBanner
          request={pendingDeletion}
          pending={deletionPending}
          onRevoke={onRevokeDeletion}
        />
      )}
    </div>
  );
}
