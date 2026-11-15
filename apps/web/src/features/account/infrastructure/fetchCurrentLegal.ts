import { apiClient } from '@src/shared/api/apiClient';
import type { FetchCurrentLegal } from '../application/ports';
import { accountApiResult } from './accountApiResult';
export const fetchCurrentLegal: FetchCurrentLegal = async () => {
  try {
    return accountApiResult(await apiClient.GET('/api/legal/current'));
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
