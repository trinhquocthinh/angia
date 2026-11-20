import { HouseholdHomeBody } from './HouseholdHomeBody';
import { Button } from '@src/shared/ui/button/Button';
import type {
  DeletionRequest,
  OwnershipOffer,
  OwnProfileDisposition,
} from '../../application/householdHomePorts';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { HouseholdHomeHeader } from './HouseholdHomeHeader';
import { useIsDesktopLayout } from './useIsDesktopLayout';

export type HouseholdHomeCardProps = {
  familyName: string;
  viewerRole: HouseholdMemberRole;
  csrfToken: string;
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
  onReloadMembers: () => Promise<void>;
  onSendOffer: (targetAccountId: string) => void;
  onRevokeOffer: (offerId: string) => void;
  onDecideOffer: (offerId: string, accept: boolean) => void;
  onLeave: (disposition: OwnProfileDisposition) => Promise<boolean>;
  onClearLeaveError: () => void;
  onRequestDeletion: (confirmFamilyName: string) => Promise<boolean>;
  onRevokeDeletion: (requestId: string) => void;
  onClearDeletionError: () => void;
};

export function HouseholdHomeCard(props: HouseholdHomeCardProps) {
  const isDesktop = useIsDesktopLayout();
  const self = props.members?.find((member) => member.isSelf);
  const viewerRole = self?.role ?? props.viewerRole;

  return (
    <div className="household-home-shell" aria-labelledby="household-home-title">
      <HouseholdHomeHeader
        familyName={props.familyName}
        members={props.members}
        viewerRole={viewerRole}
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
      {props.members && self && (
        <HouseholdHomeBody
          props={props}
          self={self}
          members={props.members}
          viewerRole={viewerRole}
          isDesktop={isDesktop}
        />
      )}
    </div>
  );
}
