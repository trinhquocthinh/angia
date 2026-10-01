import { apiClient } from '@src/shared/api/apiClient';
import type { SystemHealth } from '../domain/SystemHealth';

export async function fetchHealth(): Promise<SystemHealth> {
  // 503 vẫn trả về thân JSON hợp lệ (status = degraded) nên đọc cả nhánh error.
  const { data, error } = await apiClient.GET('/api/health');
  const body = data ?? error;
  if (!body) throw new Error('Không nhận được phản hồi từ /api/health');
  return body;
}
