import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { Button } from '@src/shared/ui/button/Button';
import { useHouseholdMembers } from '../../application/useHouseholdMembers';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { householdMembersRepository } from '../../infrastructure/householdMembersRepository';
import { MemberDetailBreadcrumb } from './MemberDetailBreadcrumb';
import { MemberDetailCard } from './MemberDetailCard';
import { MemberProtectedNotice } from './MemberProtectedNotice';
import './household-members.css';

const profilesRepository = createProfilesRepository();

function protectedMessage(
  viewerRole: HouseholdMemberRole,
  member: HouseholdMember | undefined,
): string | null {
  if (!member) return 'Người này không còn trong nhà.';
  if (member.isOwner) return 'Chủ hộ được bảo vệ nên không thể đổi vai trò hoặc gỡ khỏi nhà.';
  if (member.isSelf)
    return 'Bạn không thể tự đổi vai trò hoặc gỡ tài khoản của mình tại đây. Rời nhà nằm trong mục Tài khoản.';
  if (viewerRole !== 'main') return 'Chỉ Chủ hộ hoặc Đồng quản lý mới có thể thay đổi thành viên.';
  return null;
}

export function HouseholdMemberDetailPage({ accountId }: { accountId: string }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const hasFamily = Boolean(session.data?.family && session.data.role);
  const scope = session.data?.family ? `${session.data.account.id}:${session.data.family.id}` : 'none';
  const membersState = useHouseholdMembers(householdMembersRepository, scope, hasFamily);

  if (!session.data?.family || !session.data.role) return null;

  const member = membersState.query.data?.find((item) => item.accountId === accountId);
  const notice = membersState.query.data ? protectedMessage(session.data.role, member) : null;
  const errorMessage = membersState.query.isError
    ? membersState.query.error instanceof Error
      ? membersState.query.error.message
      : 'Chưa thể tải thông tin thành viên.'
    : null;

  return (
    <ProfileFrame
      session={session.data}
      profiles={workspace.profiles.data ?? []}
      logout={workspace.logout}
      mobileTitle="Chi tiết thành viên"
    >
      <div className="household-member-detail-shell">
        <MemberDetailBreadcrumb displayName={member?.displayName ?? null} />
        {membersState.query.isPending && (
          <section className="household-member-detail-card">
            <p role="status" className="household-members-status">
              Đang tải thông tin thành viên…
            </p>
          </section>
        )}
        {errorMessage && (
          <section className="household-member-detail-card household-members-error">
            <p role="alert">{errorMessage}</p>
            <Button variant="secondary" onClick={() => void membersState.query.refetch()}>
              Thử lại
            </Button>
          </section>
        )}
        {notice && <MemberProtectedNotice message={notice} />}
        {member && !notice && (
          <MemberDetailCard
            key={`${member.accountId}:${member.role}`}
            member={member}
            csrfToken={session.data.csrfToken}
            onReload={membersState.reload}
          />
        )}
      </div>
    </ProfileFrame>
  );
}
