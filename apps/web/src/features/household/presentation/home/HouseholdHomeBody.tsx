import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import type { HouseholdHomeCardProps } from './HouseholdHomeCard';
import { HouseholdMembersSection } from '../members/HouseholdMembersSection';
import { HouseholdGovernanceSection } from './HouseholdGovernanceSection';
import { HouseholdHomeBanners } from './HouseholdHomeBanners';

function scrollToDelete() {
  document.getElementById('household-delete-section')?.scrollIntoView({ behavior: 'smooth' });
}

type BodyProps = {
  props: HouseholdHomeCardProps;
  self: HouseholdMember;
  members: HouseholdMember[];
  viewerRole: HouseholdMemberRole;
  isDesktop: boolean;
};

export function HouseholdHomeBody({ props, self, members, viewerRole, isDesktop }: BodyProps) {
  return (
    <>
      <HouseholdHomeBanners
        familyName={props.familyName}
        isOwner={self.isOwner}
        selfAccountId={self.accountId}
        pendingOffer={props.pendingOffer}
        pendingDeletion={props.pendingDeletion}
        ownershipPending={props.ownershipPending}
        ownershipError={props.ownershipError}
        deletionPending={props.deletionPending}
        onRevokeOffer={props.onRevokeOffer}
        onDecideOffer={props.onDecideOffer}
        onRevokeDeletion={props.onRevokeDeletion}
      />
      <HouseholdMembersSection
        members={members}
        viewerRole={viewerRole}
        csrfToken={props.csrfToken}
        isDesktop={isDesktop}
        onReload={props.onReloadMembers}
      />
      <HouseholdGovernanceSection
        {...props}
        self={self}
        members={members}
        onScrollToDelete={scrollToDelete}
      />
    </>
  );
}
