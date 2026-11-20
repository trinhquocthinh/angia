import type { HouseholdMember, HouseholdMemberRole } from './memberPorts';

export function memberRoleLabel(member: Pick<HouseholdMember, 'isOwner' | 'role'>): string {
  if (member.isOwner) return 'Chủ hộ';
  return member.role === 'main' ? 'Đồng quản lý' : 'Thành viên';
}

export function memberRoleDescription(role: HouseholdMemberRole): string {
  return role === 'main'
    ? 'Quản lý hồ sơ sức khỏe và thành viên trong nhà: mời người thân, đổi vai trò và gỡ thành viên.'
    : 'Chỉ xem hồ sơ được liên kết với mình. Không mời, đổi vai trò hay gỡ thành viên khác.';
}

export function canManageMember(
  viewerRole: HouseholdMemberRole,
  member: Pick<HouseholdMember, 'isOwner' | 'isSelf'>,
): boolean {
  return viewerRole === 'main' && !member.isOwner && !member.isSelf;
}
