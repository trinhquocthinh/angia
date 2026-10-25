import type { Family, FamilyRole, MemberAccount } from '@src/features/family/domain/Membership.js';
import type { FamilyAdminRepository } from '@src/features/family/application/ports.js';

interface FakeState {
  families: Family[];
  accounts: MemberAccount[];
}

// Repository trong bộ nhớ cho unit test use case; không mô phỏng khóa vì test chạy tuần tự.
export function createFakeFamilyAdminRepository(seed: Partial<FakeState> = {}) {
  const state: FakeState = { families: [...(seed.families ?? [])], accounts: [...(seed.accounts ?? [])] };
  const update = (accountId: string, patch: Partial<MemberAccount>) => {
    const index = state.accounts.findIndex((account) => account.id === accountId);
    const next = { ...state.accounts[index], ...patch } as MemberAccount;
    state.accounts[index] = next;
    return Promise.resolve(next);
  };
  const repository: FamilyAdminRepository = {
    createFamily(name) {
      const family = { id: `family-${state.families.length + 1}`, name, createdAt: new Date(0) };
      state.families.push(family);
      return Promise.resolve(family);
    },
    listFamilies: () => Promise.resolve([...state.families]),
    listAccounts: () => Promise.resolve([...state.accounts]),
    inTransaction: (work) =>
      work({
        lockAccount: (id) => Promise.resolve(state.accounts.find((account) => account.id === id) ?? null),
        lockFamilyMembers(familyId) {
          if (!state.families.some((family) => family.id === familyId)) {
            return Promise.resolve(null);
          }
          const members = state.accounts.filter((account) => account.familyId === familyId);
          const mains = members.filter((account) => account.role === 'main').length;
          return Promise.resolve({ total: members.length, mains });
        },
        assign: (id, familyId, role: FamilyRole) => update(id, { familyId, role }),
        changeRole: (id, role) => update(id, { role }),
        remove: (id) => update(id, { familyId: null, role: null }),
      }),
  };
  return { repository, state };
}
