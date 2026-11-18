import { apiClient } from '@src/shared/api/apiClient';
import type { SubmitHousehold } from '../application/ports';

export const submitHousehold: SubmitHousehold = async (body, csrfToken) => {
  try {
    const { response, data, error } = await apiClient.POST('/api/families', {
      body,
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (response.status === 201 && data) return { ok: true };
    return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
