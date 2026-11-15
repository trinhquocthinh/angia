import { apiClient } from '@src/shared/api/apiClient';
import type { FetchCurrentSession } from '../application/useCurrentSession';

export const fetchCurrentSession: FetchCurrentSession = async (signal) => {
  const { data, error, response } = await apiClient.GET('/api/me', { signal: signal ?? null });
  if (
    response.status === 401 ||
    (response.status === 403 && error?.error.code === 'ERR_PASSWORD_CHANGE_REQUIRED')
  )
    return null;
  if (!response.ok || !data) throw new Error('Không thể kiểm tra phiên. Vui lòng thử lại.');
  return data;
};
