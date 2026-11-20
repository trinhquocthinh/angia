import type { householdHomeFixture } from './householdHomeFixture.js';

export function setFourHouseholdMembers(state: Awaited<ReturnType<typeof householdHomeFixture>>) {
  state.membersState.members = [
    { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
    { accountId: 'account', displayName: 'Lan', role: 'main', isOwner: false, isSelf: true },
    { accountId: 'member-hoa', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: false },
    { accountId: 'main-tuan', displayName: 'Anh Tuấn', role: 'main', isOwner: false, isSelf: false },
  ];
}
