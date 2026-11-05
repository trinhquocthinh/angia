import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import type { DoseAction, DoseConfirmationRepository } from './ports';
import { profileDayRemindersKey } from './profileDayRemindersKey';

// SPEC-046: giữ khóa nút đến khi đọc lại xong, nên tên người xác nhận luôn là bản do máy chủ trả.
export function useDoseConfirmation(
  repository: DoseConfirmationRepository,
  session: ProfileSession,
  reminderId: string,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [pending, setPending] = useState<DoseAction | null>(null);
  const [failure, setFailure] = useState<{ action: DoseAction; error: MedicationRequestError } | null>(null);
  const refresh = () =>
    Promise.all(
      [
        ['my-reminder', reminderId],
        [...selfProfileKey(session), 'reminders'],
        profileDayRemindersKey(session),
      ].map((queryKey) => client.invalidateQueries({ queryKey })),
    );
  const run = async (action: DoseAction) => {
    if (busy.current) return;
    busy.current = true;
    setPending(action);
    setFailure(null);
    try {
      await repository[action](reminderId, session.csrfToken);
      await refresh();
    } catch (cause) {
      const error =
        cause instanceof MedicationRequestError
          ? cause
          : new MedicationRequestError('Không thể cập nhật xác nhận. Vui lòng thử lại.', 0);
      setFailure({ action, error });
      if (error.status === 404 || error.status === 422) void refresh();
      if (error.status === 401 || error.status === 403 || error.code === 'ERR_CONSENT_REQUIRED') {
        void client.invalidateQueries({ queryKey: ['current-session'] });
        void client.invalidateQueries({ queryKey: ['profiles'] });
      }
    } finally {
      busy.current = false;
      setPending(null);
    }
  };
  return { pending, failure, confirm: () => run('confirm'), undo: () => run('undo') };
}
