import { aiRoutingViewSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readAdminResponse } from '@src/features/family/infrastructure/readAdminResponse';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import type { AiRoutingRepository } from '../application/ports';

// Không dùng mặc định khi backend thiếu migration/lỗi hoặc trả dữ liệu ngoài hợp đồng.
export function createAiRoutingRepository(client = apiClient): AiRoutingRepository {
  const read = (response: Parameters<typeof readAdminResponse<unknown>>[0]) => {
    const parsed = aiRoutingViewSchema.safeParse(readAdminResponse(response));
    if (!parsed.success) throw new AdminRequestError('ERR_INTERNAL');
    return parsed.data;
  };
  return {
    get: async (signal) =>
      read(await client.GET('/api/admin/ai-routing', { signal: signal ?? null, cache: 'no-store' })),
    save: async (input, csrfToken) =>
      read(
        await client.PUT('/api/admin/ai-routing', {
          body: input,
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}
