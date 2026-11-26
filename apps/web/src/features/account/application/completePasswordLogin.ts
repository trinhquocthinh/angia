import { PASSWORD_RESET_BY_KEY, RESTRICTED_CSRF_KEY, writeAccountStorage } from './accountSessionStorage';
import { completeAccountAccess } from './completeAccountAccess';
export async function completePasswordLogin(
  session: { csrfToken: string; passwordChangeRequired: boolean; passwordResetBy: string | null },
  invalidate: Parameters<typeof completeAccountAccess>[0],
  navigate: (options: { to: '/' | '/account/change-password'; replace: true }) => Promise<unknown>,
) {
  writeAccountStorage(RESTRICTED_CSRF_KEY, session.passwordChangeRequired ? session.csrfToken : null);
  writeAccountStorage(PASSWORD_RESET_BY_KEY, session.passwordChangeRequired ? session.passwordResetBy : null);
  if (session.passwordChangeRequired) {
    await navigate({ to: '/account/change-password', replace: true });
  } else {
    await completeAccountAccess(invalidate, navigate);
  }
}
