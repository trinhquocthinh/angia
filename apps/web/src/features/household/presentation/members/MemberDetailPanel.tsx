import { MemberDetailLayout } from './MemberDetailLayout';
import type { MemberDetailLayoutProps } from './memberDetailLayoutProps';
import type { HouseholdMember } from '../../application/memberPorts';
import { PanelEmptyState } from './PanelEmptyState';
import { PanelNotice } from './PanelNotice';
import { MemberEditorBody } from './MemberEditorBody';

type Props = MemberDetailLayoutProps & {
  member: HouseholdMember | null;
  notice?: string | null;
  csrfToken: string;
  onReload: () => Promise<void>;
  onClose: () => void;
  onNotFound?: (message: string) => void;
  titleId?: string;
};

export function MemberDetailPanel({
  member,
  notice = null,
  csrfToken,
  onReload,
  onClose,
  onNotFound,
  titleId,
  isDesktop = true,
  returnFocusRef,
}: Props) {
  if (!member || notice) {
    if (!isDesktop && !notice) return null;
    return (
      <MemberDetailLayout isDesktop={isDesktop} returnFocusRef={returnFocusRef} onClose={onClose}>
        {notice ? <PanelNotice message={notice} onClose={onClose} /> : <PanelEmptyState />}
      </MemberDetailLayout>
    );
  }
  return (
    <MemberEditorBody
      key={`${member.accountId}:${member.role}`}
      isDesktop={isDesktop}
      returnFocusRef={returnFocusRef}
      member={member}
      csrfToken={csrfToken}
      onReload={onReload}
      onClose={onClose}
      onNotFound={onNotFound}
      titleId={titleId}
    />
  );
}
