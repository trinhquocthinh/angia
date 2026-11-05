import { myRevisitReminderSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import type { MyRevisitReminderRepository } from '../application/ports';

export function createMyRevisitReminderRepository(client = apiClient): MyRevisitReminderRepository {
  return {
    get: async (reminderId, signal) =>
      myRevisitReminderSchema.parse(
        readStoppingResponse(
          await client.GET('/api/me/revisit-reminders/{reminderId}', {
            params: { path: { reminderId } },
            cache: 'no-store',
            ...(signal ? { signal } : {}),
          }),
          'Không thể tải lời nhắc. Vui lòng thử lại.',
        ),
      ),
  };
}
