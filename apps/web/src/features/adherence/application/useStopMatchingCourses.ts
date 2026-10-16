import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MedicationStoppingRepository } from '@src/features/medications/application/stoppingPorts';
import type { ProfileSession } from '@src/features/profiles/application/ports';

type State = { pending: boolean; stopped: boolean; failed: boolean };
const initial: State = { pending: false, stopped: false, failed: false };

// Dừng lần lượt các đợt người dùng đã xác nhận, cùng ngày dừng = mốc "Ngưng" thực tế (SPEC-017).
export function useStopMatchingCourses(
  repository: MedicationStoppingRepository,
  session: ProfileSession,
  profileId: string,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [state, setState] = useState<State>(initial);
  const submit = async (courseIds: readonly string[], stopDate: string) => {
    if (busy.current || session.role !== 'main' || !session.family) return false;
    busy.current = true;
    setState({ pending: true, stopped: false, failed: false });
    try {
      for (const courseId of courseIds)
        await repository.stop(profileId, courseId, { stopDate }, session.csrfToken);
      setState({ pending: false, stopped: true, failed: false });
      return true;
    } catch {
      setState({ pending: false, stopped: false, failed: true });
      return false;
    } finally {
      busy.current = false;
      await client.invalidateQueries({
        queryKey: ['medications', session.account.id, session.family.id, profileId],
      });
    }
  };
  return { ...state, submit };
}
