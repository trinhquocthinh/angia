import type { components } from '@src/shared/api/schema.gen';
import type { AccountEmailStatus } from '@src/features/account/application/ports';

type FamilySummary = components['schemas']['MeContextResponse']['family'];

type EmailDisplayMode = 'empty' | 'unverified' | 'pending' | 'verified';

export type EmailSettingsState = {
  mode: EmailDisplayMode;
  canVerify: boolean;
  notice: string | null;
};

const ownerUnverifiedNotice =
  'Bạn chưa xác minh email. Nếu quên mật khẩu, bạn sẽ không lấy lại được tài khoản.';
const memberUnverifiedNotice =
  'Bạn chưa xác minh email nên chưa dùng được Quên mật khẩu. Nếu quên mật khẩu, hãy nhờ Chủ hộ hoặc Đồng quản lý đặt lại.';

export function buildEmailSettingsState(
  emailStatus: AccountEmailStatus,
  family: FamilySummary,
): EmailSettingsState {
  const mode: EmailDisplayMode = emailStatus.pendingEmail
    ? 'pending'
    : !emailStatus.email
      ? 'empty'
      : emailStatus.emailVerified
        ? 'verified'
        : 'unverified';
  const canVerify = mode === 'unverified' || mode === 'pending';
  const notice = emailStatus.emailVerified
    ? null
    : !family || family.isOwner
      ? ownerUnverifiedNotice
      : memberUnverifiedNotice;
  return { mode, canVerify, notice };
}
