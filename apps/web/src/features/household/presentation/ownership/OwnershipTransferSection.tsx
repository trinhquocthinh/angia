import { OwnershipTransferHeading } from './OwnershipTransferHeading';
import { useState } from 'react';
import type { OwnershipOffer } from '../../application/householdHomePorts';
import type { HouseholdMember } from '../../application/memberPorts';
import { OwnershipCandidateList } from './OwnershipCandidateList';
import { OwnershipPendingBanner } from './OwnershipPendingBanner';

type Props = {
  familyName: string;
  isOwner: boolean;
  selfAccountId: string;
  coManagers: HouseholdMember[];
  pendingOffer: OwnershipOffer | null;
  pending: boolean;
  error: string | null;
  onSend: (targetAccountId: string) => void;
  onRevoke: (offerId: string) => void;
  onDecide: (offerId: string, accept: boolean) => void;
};

export function OwnershipTransferSection(props: Props) {
  const { familyName, isOwner, selfAccountId, coManagers, pendingOffer, pending, error } = props;
  const isRecipient = Boolean(pendingOffer && pendingOffer.target.accountId === selfAccountId);
  const [pickedId, setPickedId] = useState<string>('');
  const selectedId = coManagers.some((m) => m.accountId === pickedId)
    ? pickedId
    : (coManagers[0]?.accountId ?? '');

  if (!isOwner && !isRecipient) return null;

  return (
    <section className="household-home-block" aria-labelledby="household-ownership-title">
      <OwnershipTransferHeading isOwner={isOwner} />
      {isOwner && (
        <OwnershipCandidateList
          coManagers={coManagers}
          selectedId={selectedId}
          hasPendingOffer={Boolean(pendingOffer)}
          pending={pending}
          onSelect={setPickedId}
          onSend={props.onSend}
        />
      )}
      {pendingOffer && (isOwner || isRecipient) && (
        <OwnershipPendingBanner
          offer={pendingOffer}
          familyName={familyName}
          isRecipient={isRecipient}
          pending={pending}
          onRevoke={props.onRevoke}
          onDecide={props.onDecide}
        />
      )}
      {error && (
        <p role="alert" className="household-home-error-alert">
          {error}
        </p>
      )}
    </section>
  );
}
