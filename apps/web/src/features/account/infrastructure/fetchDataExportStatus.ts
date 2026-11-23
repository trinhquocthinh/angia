import { apiClient } from '@src/shared/api/apiClient';
import type { FetchDataExportStatus } from '@src/features/account/application/ports';
import { accountApiResult } from '@src/features/account/infrastructure/accountApiResult';

export const fetchDataExportStatus: FetchDataExportStatus = async (exportId) => {
  try {
    const result = await apiClient.GET('/api/me/data-exports/{id}', {
      params: { path: { id: exportId } },
    });
    if (result.response.status === 200 && result.data) {
      return { ok: true, data: result.data };
    }
    const failure = accountApiResult(result);
    return failure.ok ? { ok: false, code: 'UNKNOWN' } : { ...failure, status: result.response.status };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
