import { currentVietnamYear } from './currentVietnamYear';
import type { ProfileListItem, ProfileSession } from './ports';

const MINOR_AGE_LIMIT = 18;

// Mục giám hộ chỉ áp dụng cho hồ sơ vị thành niên chưa liên kết tài khoản; chỉ main thao tác (SPEC-070).
export function canManageProfileGuardians(
  profile: Pick<ProfileListItem, 'birthYear' | 'hasLinkedAccount'>,
  session: Pick<ProfileSession, 'role'>,
  year = currentVietnamYear(),
): boolean {
  if (session.role !== 'main') return false;
  if (profile.hasLinkedAccount) return false;
  if (profile.birthYear === null) return false;
  return year - profile.birthYear < MINOR_AGE_LIMIT;
}
