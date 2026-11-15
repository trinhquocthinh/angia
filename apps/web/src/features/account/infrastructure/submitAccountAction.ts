import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitAccountAction } from '../application/ports';
import { accountApiResult } from './accountApiResult';
export const submitAccountAction: SubmitAccountAction = async (path, body, csrfToken) => {
  try {
    const headers = { 'X-CSRF-Token': csrfToken };
    const result =
      path === '/api/me/password' && 'newPassword' in body
        ? await apiClient.POST(path, { body, headers })
        : path === '/api/me/local-credential' && 'password' in body
          ? await apiClient.POST(path, { body, headers })
          : path === '/api/me/legal-acceptances' && 'versionIds' in body
            ? await apiClient.POST(path, { body, headers })
            : null;
    if (!result) return { ok: false, code: 'UNKNOWN' };
    if (result.response.status === 204) return { ok: true, data: undefined };
    const failure = accountApiResult(result);
    return failure.ok ? { ok: false, code: 'UNKNOWN' } : { ...failure, status: result.response.status };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
