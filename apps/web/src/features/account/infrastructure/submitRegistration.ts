import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitRegistration } from '../application/ports';
import { accountApiResult } from './accountApiResult';
export const submitRegistration: SubmitRegistration = async (body) => {
  try {
    return accountApiResult(await apiClient.POST('/api/auth/register', { body }));
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
