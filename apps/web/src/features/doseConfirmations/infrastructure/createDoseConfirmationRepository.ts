import { selfReminderListSchema } from '@angia/contracts';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { DoseConfirmationRepository } from '../application/ports';

const FALLBACK = 'Không thể cập nhật xác nhận. Vui lòng thử lại.';
const PATH = '/api/reminders/{reminderId}/dose-confirmation';
const writeOptions = (reminderId: string, csrf: string) => ({
  params: { path: { reminderId } },
  headers: { 'X-CSRF-Token': csrf },
});

export function createDoseConfirmationRepository(client = apiClient): DoseConfirmationRepository {
  return {
    confirm: async (reminderId, csrf) => {
      readStoppingResponse(
        await client.POST(PATH, { ...writeOptions(reminderId, csrf), body: {} }),
        FALLBACK,
      );
    },
    undo: async (reminderId, csrf) => {
      readStoppingResponse(await client.DELETE(PATH, writeOptions(reminderId, csrf)), FALLBACK);
    },
    listForProfile: async (profileId, signal) =>
      selfReminderListSchema.parse(
        readStoppingResponse(
          await client.GET('/api/health-profiles/{id}/reminders', {
            params: { path: { id: profileId } },
            cache: 'no-store',
            signal: signal ?? null,
          }),
          'Không thể tải lời nhắc. Vui lòng thử lại.',
        ),
      ),
  };
}
