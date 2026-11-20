import type { MemberDetailLayoutProps } from './memberDetailLayoutProps';
import type { HouseholdMember } from '../../application/memberPorts';

export type MemberEditorProps = MemberDetailLayoutProps & {
  member: HouseholdMember;
  csrfToken: string;
  onReload: () => Promise<void>;
  onClose: () => void;
  onNotFound?: ((message: string) => void) | undefined;
  titleId?: string | undefined;
};
