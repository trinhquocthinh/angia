import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitAccountEmailChange } from '@src/features/account/application/ports';
import { accountApiResult } from '@src/features/account/infrastructure/accountApiResult';

export const submitAccountEmailChange: SubmitAccountEmailChange = async (body, csrfToken) => {
  try {
    const result = await apiClient.PATCH('/api/me/email', {
      body,
      headers: { 'X-CSRF-Token': csrfToken },
    });
    const parsed = accountApiResult(result);
    return parsed.ok ? parsed : { ...parsed, status: result.response.status };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
