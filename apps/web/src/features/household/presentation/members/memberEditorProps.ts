import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';

export type MemberEditorProps = {
  member: HouseholdMember;
  viewerRole?: HouseholdMemberRole | undefined;
  csrfToken: string;
  onReload: () => Promise<void>;
  onClose: () => void;
  onNotFound?: ((message: string) => void) | undefined;
  titleId?: string | undefined;
};
