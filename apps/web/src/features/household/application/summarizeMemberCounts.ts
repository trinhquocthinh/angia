import type { HouseholdMember } from './memberPorts';

export type MemberCountsSummary = {
  total: number;
  owners: number;
  coManagers: number;
  regularMembers: number;
  summaryText: string;
};

export function summarizeMemberCounts(
  members: Pick<HouseholdMember, 'isOwner' | 'role'>[],
): MemberCountsSummary {
  const owners = members.filter((member) => member.isOwner).length;
  const coManagers = members.filter((member) => !member.isOwner && member.role === 'main').length;
  const regularMembers = members.filter((member) => !member.isOwner && member.role === 'member').length;
  const total = members.length;
  return {
    total,
    owners,
    coManagers,
    regularMembers,
    summaryText: `${total} thành viên · ${owners} Chủ hộ / ${coManagers} Đồng quản lý / ${regularMembers} Thành viên`,
  };
}
