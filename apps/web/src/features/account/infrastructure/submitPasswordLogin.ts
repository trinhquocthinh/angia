import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitPasswordLogin } from '../application/ports';
import { accountApiResult } from './accountApiResult';
export const submitPasswordLogin: SubmitPasswordLogin = async (body) => {
  try {
    return accountApiResult(await apiClient.POST('/api/auth/password-login', { body }));
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
