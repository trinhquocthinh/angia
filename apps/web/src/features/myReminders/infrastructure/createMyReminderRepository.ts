import { myReminderSchema } from '@angia/contracts';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { MyReminderRepository } from '../application/ports';

export function createMyReminderRepository(client = apiClient): MyReminderRepository {
  return {
    get: async (reminderId, signal) =>
      myReminderSchema.parse(
        readStoppingResponse(
          await client.GET('/api/me/reminders/{reminderId}', {
            params: { path: { reminderId } },
            ...(signal ? { signal } : {}),
          }),
          'Không thể tải lời nhắc. Vui lòng thử lại.',
        ),
      ),
  };
}
