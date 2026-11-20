import type {
  DeletionRequest,
  OwnershipOffer,
  OwnProfileDisposition,
} from '../../application/householdHomePorts';
import type { HouseholdMember } from '../../application/memberPorts';
export type HouseholdGovernanceProps = {
  familyName: string;
  self: HouseholdMember;
  members: HouseholdMember[];
  pendingOffer: OwnershipOffer | null;
  pendingDeletion: DeletionRequest | null;
  ownershipPending: boolean;
  ownershipError: string | null;
  leavePending: boolean;
  leaveError: string | null;
  leaveErrorCode: string | null;
  deletionPending: boolean;
  deletionError: string | null;
  onSendOffer: (targetAccountId: string) => void;
  onRevokeOffer: (offerId: string) => void;
  onDecideOffer: (offerId: string, accept: boolean) => void;
  onLeave: (disposition: OwnProfileDisposition) => Promise<boolean>;
  onClearLeaveError: () => void;
  onRequestDeletion: (confirmFamilyName: string) => Promise<boolean>;
  onRevokeDeletion: (requestId: string) => void;
  onClearDeletionError: () => void;
  onScrollToDelete: () => void;
};
