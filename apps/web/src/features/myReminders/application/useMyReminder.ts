import { useQuery } from '@tanstack/react-query';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { MyReminderRepository } from './ports';

// SPEC-035: luôn đọc lại từ máy chủ (quyền người nhận có thể đổi); lỗi 4xx (404/403) không thử lại.
export function useMyReminder(repository: MyReminderRepository, reminderId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['my-reminder', reminderId],
    enabled,
    staleTime: 0,
    retry: (failures, error) =>
      !(error instanceof MedicationRequestError && error.status < 500) && failures < 2,
    queryFn: ({ signal }) => repository.get(reminderId, signal),
  });
}
