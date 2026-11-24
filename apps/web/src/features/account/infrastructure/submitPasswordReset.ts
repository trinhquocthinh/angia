import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitPasswordReset } from '@src/features/account/application/ports';
import { accountApiResult } from '@src/features/account/infrastructure/accountApiResult';

export const submitPasswordReset: SubmitPasswordReset = async (body) => {
  try {
    const result = await apiClient.POST('/api/auth/password-resets', { body });
    if (result.response.status === 204) return { ok: true, data: undefined };
    const failure = accountApiResult(result);
    return failure.ok ? { ok: false, code: 'UNKNOWN' } : { ...failure, status: result.response.status };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
