import { describe, expect, it } from 'vitest';
import { inspectHouseholdInvitation } from './inspectHouseholdInvitation.js';

describe('SPEC-065: kiểm tra loại lời mời công khai', () => {
  it.each(['main', 'member'] as const)('SPEC-065: chỉ trả loại và vai trò %s', async (role) => {
    const repository = {
      verify: async (token: string) =>
        token === 'A'.repeat(43)
          ? { kind: 'join_family' as const, role, familyId: 'bí mật', id: 'bí mật' }
          : null,
    };
    expect(await inspectHouseholdInvitation(repository, 'A'.repeat(43))).toEqual({
      kind: 'join_family',
      role,
    });
    expect(await inspectHouseholdInvitation(repository, 'B'.repeat(43))).toBeNull();
  });
  it('SPEC-065: lời mời lập nhà chỉ trả loại', async () => {
    expect(
      await inspectHouseholdInvitation(
        {
          verify: async () => ({ kind: 'found_family' as const, id: 'bí mật' }),
        },
        'A'.repeat(43),
      ),
    ).toEqual({ kind: 'found_family' });
  });
  it('SPEC-065: lời mời không còn hiệu lực trả null', async () => {
    expect(await inspectHouseholdInvitation({ verify: async () => null }, 'A'.repeat(43))).toBeNull();
  });
});
