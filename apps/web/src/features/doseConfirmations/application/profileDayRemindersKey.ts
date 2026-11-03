import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';

// Nằm dưới tiền tố hồ sơ để đổi tài khoản, gia đình hay rút đồng thuận đều làm mới.
export function profileDayRemindersKey(session: ProfileSession) {
  return [...profileScopeKey(session), 'day-reminders'] as const;
}
