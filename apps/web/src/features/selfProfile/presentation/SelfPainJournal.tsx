import { useNavigate } from '@tanstack/react-router';
import type { SelfProfile } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { PainJournalWorkspace } from '@src/features/painJournal/presentation/PainJournalTab/PainJournalWorkspace';
import { PainIssueDetail } from '@src/features/painJournal/presentation/PainIssueDetail/PainIssueDetail';

// SPEC-057: chỉ dùng hồ sơ liên kết; mọi request đau nhức đi qua cửa tự quản.
export function SelfPainJournal({
  session,
  profile,
  issueId,
}: {
  session: ProfileSession;
  profile: SelfProfile;
  issueId?: string | undefined;
}) {
  const navigate = useNavigate();
  if (!session.family || profile.id !== session.account.healthProfileId)
    return <p role="alert">Tài khoản chưa liên kết hồ sơ sức khỏe.</p>;
  const context = { id: profile.id, familyId: session.family.id, consentStatus: profile.consentStatus };
  const open = (id: string) => {
    void navigate({ to: '/my-profile/pain/$issueId', params: { issueId: id } });
  };
  return issueId ? (
    <PainIssueDetail
      session={session}
      profile={context}
      scope="self"
      issueId={issueId}
      onBack={() => {
        void navigate({ to: '/my-profile', search: { section: 'pain' }, replace: true });
      }}
      onOpenIssue={open}
    />
  ) : (
    <PainJournalWorkspace
      session={session}
      profile={context}
      scope="self"
      onOpen={(issue) => open(issue.id)}
    />
  );
}
