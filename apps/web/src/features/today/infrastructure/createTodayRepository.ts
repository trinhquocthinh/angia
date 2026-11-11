import { selfReminderListSchema } from '@angia/contracts';
import { createDoseConfirmationRepository } from '@src/features/doseConfirmations/infrastructure/createDoseConfirmationRepository';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { TodayRepository } from '../application/ports';

export function createTodayRepository(client = apiClient): TodayRepository {
  return {
    ...createDoseConfirmationRepository(client),
    listForSelf: async (signal) =>
      selfReminderListSchema.parse(
        readStoppingResponse(
          await client.GET('/api/me/profile/reminders', {
            cache: 'no-store',
            signal: signal ?? null,
          }),
          'Không thể tải liều hôm nay. Vui lòng thử lại.',
        ),
      ),
  };
}
