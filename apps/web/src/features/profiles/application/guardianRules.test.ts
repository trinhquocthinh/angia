import { describe, expect, it } from 'vitest';
import { canManageProfileGuardians } from './canManageProfileGuardians';
import { filterGuardianCandidates, guardianErrorMessage, guardianInitials } from './guardianRules';
import type { GuardianCandidate, ProfileGuardian } from './guardianPorts';

describe('TC-816 — quy tắc hiển thị, lọc ứng viên và lỗi người giám hộ', () => {
  const baseProfile = { birthYear: 2018, hasLinkedAccount: false };
  const mainSession = { role: 'main' as const };

  it('TC-816 — chỉ cho phép hiển thị mục giám hộ với hồ sơ vị thành niên chưa liên kết khi người xem là main', () => {
    expect(canManageProfileGuardians(baseProfile, mainSession, 2026)).toBe(true);
    expect(canManageProfileGuardians({ birthYear: 2009, hasLinkedAccount: false }, mainSession, 2026)).toBe(
      true,
    );
    expect(canManageProfileGuardians({ birthYear: 2008, hasLinkedAccount: false }, mainSession, 2026)).toBe(
      false,
    );
    expect(canManageProfileGuardians({ birthYear: null, hasLinkedAccount: false }, mainSession, 2026)).toBe(
      false,
    );
    expect(canManageProfileGuardians({ birthYear: 2018, hasLinkedAccount: true }, mainSession, 2026)).toBe(
      false,
    );
    expect(canManageProfileGuardians(baseProfile, { role: 'member' }, 2026)).toBe(false);
    expect(canManageProfileGuardians(baseProfile, { role: null }, 2026)).toBe(false);
  });

  it('TC-816 — lọc ứng viên: chỉ giữ Chủ hộ/Đồng quản lý chưa là giám hộ', () => {
    const members: GuardianCandidate[] = [
      { accountId: 'owner', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
      { accountId: 'lan', displayName: 'Mẹ Lan', role: 'main', isOwner: false, isSelf: true },
      { accountId: 'tuan', displayName: 'Anh Tuấn', role: 'main', isOwner: false, isSelf: false },
      { accountId: 'hoa', displayName: 'Cô Hoa', role: 'member', isOwner: false, isSelf: false },
    ];
    const guardians: ProfileGuardian[] = [{ accountId: 'lan', displayName: 'Mẹ Lan', isMe: true }];

    expect(filterGuardianCandidates(members, guardians).map((item) => item.accountId)).toEqual([
      'owner',
      'tuan',
    ]);
  });

  it('TC-816 — ánh xạ mã lỗi ERR_LAST_GUARDIAN và lỗi lưu khác sang thông điệp tiếng Việt', () => {
    expect(guardianErrorMessage('ERR_LAST_GUARDIAN')).toBe(
      'Bạn là người giám hộ duy nhất. Hãy thêm người giám hộ khác trước khi tự gỡ.',
    );
    expect(guardianErrorMessage('ERR_VALIDATION')).toBe('Chưa lưu được. Thử lại sau.');
    expect(guardianErrorMessage('UNKNOWN')).toBe('Chưa lưu được. Thử lại sau.');
  });

  it('TC-816 — tạo chữ cái đại diện từ tên hiển thị', () => {
    expect(guardianInitials('Ba Minh')).toBe('BM');
    expect(guardianInitials('Nguyễn Hoàng An')).toBe('HA');
    expect(guardianInitials('Lan')).toBe('LA');
    expect(guardianInitials('  ')).toBe('?');
  });
});
