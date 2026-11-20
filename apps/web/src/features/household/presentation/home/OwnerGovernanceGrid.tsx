import type { HouseholdGovernanceProps } from './householdGovernanceProps';
import { HouseholdGovernanceLeave } from './HouseholdGovernanceLeave';
import { DeleteHouseholdSection } from '../deletion/DeleteHouseholdSection';
import { OwnershipTransferSection } from '../ownership/OwnershipTransferSection';

export function OwnerGovernanceGrid({ props }: { props: HouseholdGovernanceProps }) {
  const others = props.members.filter((member) => !member.isSelf);
  const coManagers = others.filter((member) => member.role === 'main');
  return (
    <div className="household-governance-grid">
      <OwnershipTransferSection
        familyName={props.familyName}
        isOwner={true}
        selfAccountId={props.self.accountId}
        coManagers={coManagers}
        pendingOffer={props.pendingOffer}
        pending={props.ownershipPending}
        error={props.ownershipError}
        hideBanner={true}
        onSend={props.onSendOffer}
        onRevoke={props.onRevokeOffer}
        onDecide={props.onDecideOffer}
      />
      <HouseholdGovernanceLeave {...props} />
      <DeleteHouseholdSection
        familyName={props.familyName}
        otherCount={others.length}
        pendingDeletion={props.pendingDeletion}
        pending={props.deletionPending}
        error={props.deletionError}
        hideBanner={true}
        onRequest={props.onRequestDeletion}
        onRevoke={props.onRevokeDeletion}
        onClearError={props.onClearDeletionError}
      />
    </div>
  );
}
