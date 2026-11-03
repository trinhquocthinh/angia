import { describe, expect, it } from 'vitest';
import { linkCandidates } from './linkCandidates';
import type { Account } from './ports';
const account = (id: string, familyId: string | null): Account => ({
  id,
  displayName: id,
  isSystemAdmin: false,
  familyId,
  role: familyId ? 'member' : null,
});
describe('TC-563 — Tài khoản nhận được liên kết', () => {
  it('chỉ cùng nhóm và chưa liên kết hồ sơ nào', () => {
    const accounts = [
      account('free', 'f'),
      account('linked', 'f'),
      account('other', 'g'),
      account('none', null),
    ];
    const profiles = [
      { id: 'p1', displayName: 'Mẹ', linkedAccount: { id: 'linked', displayName: 'linked' } },
      { id: 'p2', displayName: 'Ba', linkedAccount: null },
    ];
    expect(linkCandidates(accounts, 'f', profiles).map((item) => item.id)).toEqual(['free']);
  });
});
