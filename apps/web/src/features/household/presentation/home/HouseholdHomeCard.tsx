import { Button } from '@src/shared/ui/button/Button';
import type {
  DeletionRequest,
  OwnershipOffer,
  OwnProfileDisposition,
} from '../../application/householdHomePorts';
import type { HouseholdMember } from '../../application/memberPorts';
import { DeleteHouseholdSection } from '../deletion/DeleteHouseholdSection';
import { LeaveHouseholdSection } from '../leave/LeaveHouseholdSection';
import { OwnershipTransferSection } from '../ownership/OwnershipTransferSection';
import { HouseholdHomeHeader } from './HouseholdHomeHeader';

export type HouseholdHomeCardProps = {
  familyName: string;
  members: HouseholdMember[] | undefined;
  pendingOffer: OwnershipOffer | null;
  pendingDeletion: DeletionRequest | null;
  isPending: boolean;
  errorMessage: string | null;
  ownershipPending: boolean;
  ownershipError: string | null;
  leavePending: boolean;
  leaveError: string | null;
  leaveErrorCode: string | null;
  deletionPending: boolean;
  deletionError: string | null;
  onRetry: () => void;
  onSendOffer: (targetAccountId: string) => void;
  onRevokeOffer: (offerId: string) => void;
  onDecideOffer: (offerId: string, accept: boolean) => void;
  onLeave: (disposition: OwnProfileDisposition) => Promise<boolean>;
  onClearLeaveError: () => void;
  onRequestDeletion: (confirmFamilyName: string) => Promise<boolean>;
  onRevokeDeletion: (requestId: string) => void;
  onClearDeletionError: () => void;
};

function scrollToDelete() {
  document.getElementById('household-delete-section')?.scrollIntoView({ behavior: 'smooth' });
}

function renderSections(props: HouseholdHomeCardProps, self: HouseholdMember, members: HouseholdMember[]) {
  const isOwner = self.isOwner;
  const otherMembers = members.filter((member) => !member.isSelf);
  const coManagers = otherMembers.filter((member) => member.role === 'main');
  return (
    <div className="household-home-sections">
      <OwnershipTransferSection
        familyName={props.familyName}
        isOwner={isOwner}
        selfAccountId={self.accountId}
        coManagers={coManagers}
        pendingOffer={props.pendingOffer}
        pending={props.ownershipPending}
        error={props.ownershipError}
        onSend={props.onSendOffer}
        onRevoke={props.onRevokeOffer}
        onDecide={props.onDecideOffer}
      />
      <LeaveHouseholdSection
        familyName={props.familyName}
        isOwner={isOwner}
        otherCount={otherMembers.length}
        pending={props.leavePending}
        error={props.leaveError}
        errorCode={props.leaveErrorCode}
        onLeave={props.onLeave}
        onClearError={props.onClearLeaveError}
        onScrollToDelete={scrollToDelete}
      />
      {isOwner && (
        <DeleteHouseholdSection
          familyName={props.familyName}
          otherCount={otherMembers.length}
          pendingDeletion={props.pendingDeletion}
          pending={props.deletionPending}
          error={props.deletionError}
          onRequest={props.onRequestDeletion}
          onRevoke={props.onRevokeDeletion}
          onClearError={props.onClearDeletionError}
        />
      )}
    </div>
  );
}

export function HouseholdHomeCard(props: HouseholdHomeCardProps) {
  const self = props.members?.find((member) => member.isSelf);
  return (
    <section className="household-home-card" aria-labelledby="household-home-title">
      <HouseholdHomeHeader
        familyName={props.familyName}
        memberCount={props.members ? props.members.length : null}
        hasPendingDeletion={Boolean(props.pendingDeletion)}
      />
      {props.isPending && (
        <p role="status" className="household-home-status-copy">
          Đang tải thông tin nhà…
        </p>
      )}
      {props.errorMessage && (
        <div className="household-home-load-error">
          <p role="alert">{props.errorMessage}</p>
          <Button variant="secondary" onClick={props.onRetry}>
            Thử lại
          </Button>
        </div>
      )}
      {props.members && self && renderSections(props, self, props.members)}
    </section>
  );
}
