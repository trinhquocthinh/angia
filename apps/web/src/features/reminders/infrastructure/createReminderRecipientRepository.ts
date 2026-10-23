import { reminderRecipientsSchema } from '@angia/contracts';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { ReminderRecipientRepository } from '../application/recipientPorts';

export function createReminderRecipientRepository(client = apiClient): ReminderRecipientRepository {
  return {
    get: async (profileId, signal) =>
      reminderRecipientsSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/reminder-recipients', {
            params: { path: { id: profileId } },
            ...(signal ? { signal } : {}),
          }),
          'Không thể tải người nhận nhắc. Vui lòng thử lại.',
        ),
      ),
    save: async (profileId, recipientAccountIds, csrfToken) =>
      reminderRecipientsSchema.parse(
        readStoppingResponse(
          await client.PUT('/api/health-profiles/{id}/reminder-recipients', {
            params: { path: { id: profileId } },
            body: { recipientAccountIds },
            headers: { 'X-CSRF-Token': csrfToken },
          }),
          'Không thể lưu người nhận nhắc. Vui lòng thử lại.',
        ),
      ),
  };
}
