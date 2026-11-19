import type { HouseholdMember, HouseholdMemberRole } from './memberPorts';

export function memberRoleLabel(member: Pick<HouseholdMember, 'isOwner' | 'role'>): string {
  if (member.isOwner) return 'Chủ hộ';
  return member.role === 'main' ? 'Đồng quản lý' : 'Thành viên';
}

export function memberRoleDescription(role: HouseholdMemberRole): string {
  return role === 'main' ? 'Quản lý hồ sơ' : 'Chỉ xem hồ sơ';
}

export function canManageMember(
  viewerRole: HouseholdMemberRole,
  member: Pick<HouseholdMember, 'isOwner' | 'isSelf'>,
): boolean {
  return viewerRole === 'main' && !member.isOwner && !member.isSelf;
}

export function memberInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}
