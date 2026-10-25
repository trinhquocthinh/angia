import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MedicationCourse } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { MedicationStoppingRepository } from './stoppingPorts';
import { MedicationRequestError } from './MedicationRequestError';
export function useStopCourse(
  repository: MedicationStoppingRepository,
  session: ProfileSession,
  profileId: string,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<MedicationCourse | null>(null);
  const [error, setError] = useState<MedicationRequestError | null>(null);
  const refresh = () =>
    client.invalidateQueries({
      queryKey: ['medications', session.account.id, session.family?.id, profileId],
    });
  const submit = async (courseId: string, stopDate: string) => {
    if (busy.current || session.role !== 'main' || !session.family) return;
    busy.current = true;
    setPending(true);
    setError(null);
    setSaved(null);
    try {
      const course = await repository.stop(profileId, courseId, { stopDate }, session.csrfToken);
      setSaved(course);
      void refresh();
    } catch (cause) {
      const failure =
        cause instanceof MedicationRequestError
          ? cause
          : new MedicationRequestError('Không thể ghi nhận dừng thuốc. Vui lòng thử lại.', 0);
      setError(failure);
      if (failure.status === 404 || failure.code === 'ERR_INVALID_STATE_TRANSITION') void refresh();
      if (failure.status === 401 || failure.status === 403 || failure.code === 'ERR_CONSENT_REQUIRED') {
        void client.invalidateQueries({ queryKey: ['current-session'] });
        void client.invalidateQueries({ queryKey: ['profiles'] });
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return { pending, saved, error, submit };
}
