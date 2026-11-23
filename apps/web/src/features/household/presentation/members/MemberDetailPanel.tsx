import { useRef, useState, type RefObject } from 'react';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { MemberDetailSheet } from './MemberDetailSheet';
import { MemberEditorBody } from './MemberEditorBody';
import { PanelNotice } from './PanelNotice';

type Props = {
  member: HouseholdMember | null;
  notice?: string | null;
  viewerRole?: HouseholdMemberRole;
  csrfToken: string;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
  onReload: () => Promise<void>;
  onClose: () => void;
  onNotFound?: (message: string) => void;
  titleId?: string;
};

export function MemberDetailPanel({
  member,
  notice = null,
  viewerRole = 'main',
  csrfToken,
  returnFocusRef,
  onReload,
  onClose,
  onNotFound,
  titleId,
}: Props) {
  const [pending, setPending] = useState(false);
  const fallbackRef = useRef<HTMLButtonElement | null>(null);
  if (!member && !notice) return null;

  return (
    <MemberDetailSheet pending={pending} returnFocusRef={returnFocusRef ?? fallbackRef} onClose={onClose}>
      {notice || !member ? (
        <PanelNotice message={notice ?? ''} onClose={onClose} />
      ) : (
        <MemberEditorBody
          key={`${member.accountId}:${member.role}`}
          onPendingChange={setPending}
          member={member}
          viewerRole={viewerRole}
          csrfToken={csrfToken}
          onReload={onReload}
          onClose={onClose}
          onNotFound={onNotFound}
          titleId={titleId}
        />
      )}
    </MemberDetailSheet>
  );
}
