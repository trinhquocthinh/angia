import { useRef, useState } from 'react';
import { canManageMember } from '../../application/memberDisplay';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { MemberDetailPanel } from './MemberDetailPanel';
import { HouseholdMembersList } from './HouseholdMembersList';

type Props = {
  members: HouseholdMember[];
  viewerRole: HouseholdMemberRole;
  csrfToken: string;
  isDesktop: boolean;
  onReload: () => Promise<void>;
};

export function HouseholdMembersSection({ members, viewerRole, csrfToken, isDesktop, onReload }: Props) {
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelNotice, setPanelNotice] = useState<string | null>(null);
  const canManageAny = viewerRole === 'main';
  const selectedMember = canManageAny
    ? (members.find((item) => item.accountId === selectedId && canManageMember(viewerRole, item)) ?? null)
    : null;

  function closeDetail() {
    setPanelNotice(null);
    setSelectedId(null);
    returnFocusRef.current?.focus();
  }

  return (
    <section
      className={
        canManageAny
          ? 'household-members-directory household-members-directory-split'
          : 'household-members-directory'
      }
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !(event.target as HTMLElement).closest('dialog')) closeDetail();
      }}
      aria-labelledby="household-members-section-title"
    >
      <HouseholdMembersList
        members={members}
        viewerRole={viewerRole}
        selectedId={selectedMember?.accountId ?? null}
        onSelect={(accountId, trigger) => {
          returnFocusRef.current = trigger;
          setPanelNotice(null);
          setSelectedId(accountId);
        }}
      />
      {canManageAny && (
        <MemberDetailPanel
          returnFocusRef={returnFocusRef}
          isDesktop={isDesktop}
          member={selectedMember}
          notice={panelNotice}
          csrfToken={csrfToken}
          onReload={onReload}
          onClose={closeDetail}
          onNotFound={(message) => {
            setSelectedId(null);
            setPanelNotice(message);
          }}
        />
      )}
    </section>
  );
}
