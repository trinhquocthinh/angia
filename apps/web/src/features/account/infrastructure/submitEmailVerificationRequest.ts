import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitEmailVerificationRequest } from '@src/features/account/application/ports';
import { accountApiResult } from '@src/features/account/infrastructure/accountApiResult';

export const submitEmailVerificationRequest: SubmitEmailVerificationRequest = async (csrfToken) => {
  try {
    const result = await apiClient.POST('/api/me/email-verifications', {
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (result.response.status === 204) return { ok: true, data: { alreadyVerified: true } };
    if (result.response.status === 202 && result.data?.sent) return { ok: true, data: { sent: true } };
    const failure = accountApiResult(result);
    return failure.ok ? { ok: false, code: 'UNKNOWN' } : { ...failure, status: result.response.status };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
