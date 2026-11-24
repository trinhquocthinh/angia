import { apiClient } from '@src/shared/api/apiClient';
import type { CreateDataExport } from '@src/features/account/application/ports';
import { accountApiResult } from '@src/features/account/infrastructure/accountApiResult';

export const submitDataExportRequest: CreateDataExport = async (scope, csrfToken) => {
  try {
    const result = await apiClient.POST('/api/me/data-exports', {
      headers: { 'X-CSRF-Token': csrfToken },
      body: { scope },
    });
    if (result.response.status === 202 && result.data?.exportId) {
      return { ok: true, data: { exportId: result.data.exportId } };
    }
    const failure = accountApiResult(result);
    return failure.ok ? { ok: false, code: 'UNKNOWN' } : { ...failure, status: result.response.status };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
