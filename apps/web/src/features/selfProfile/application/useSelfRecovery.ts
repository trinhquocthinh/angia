import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from './selfProfileKey';

// Mất quyền giữa chừng: đọc lại phiên và tóm tắt để trang chuyển sang thông báo tương ứng.
// Chỉ làm mới đúng khóa tóm tắt, không làm mới mục đang lỗi để tránh vòng lặp gọi API.
export function useSelfRecovery(session: ProfileSession, error: Error | null) {
  const client = useQueryClient();
  useEffect(() => {
    if (error instanceof MedicationRequestError && [401, 403, 404, 409].includes(error.status)) {
      void client.invalidateQueries({ queryKey: ['current-session'] });
      void client.invalidateQueries({ queryKey: [...selfProfileKey(session), 'summary'], exact: true });
    }
  }, [client, error, session]);
}
