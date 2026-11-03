import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';

// Nằm dưới tiền tố hồ sơ để rút đồng thuận/gỡ liên kết làm mới; đổi tài khoản hay hồ sơ liên kết là đổi khóa.
export function selfProfileKey(session: ProfileSession) {
  return [...profileScopeKey(session), 'self', session.account.healthProfileId] as const;
}
