import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitPasswordResetRequest } from '@src/features/account/application/ports';
import { accountApiResult } from '@src/features/account/infrastructure/accountApiResult';

export const submitPasswordResetRequest: SubmitPasswordResetRequest = async (body) => {
  try {
    return accountApiResult(await apiClient.POST('/api/auth/password-reset-requests', { body }));
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
