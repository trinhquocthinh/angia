import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateSelfReportedCourseRequest, MedicationCourse } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { MedicationRepository } from './ports';
import { MedicationRequestError } from './MedicationRequestError';

type State = {
  pending: boolean;
  saved: MedicationCourse | null;
  error: MedicationRequestError | null;
  request: CreateSelfReportedCourseRequest | null;
};
const initial: State = { pending: false, saved: null, error: null, request: null };

// Snapshot để xác nhận xung đột; ref ngăn hai click trước lần render tiếp theo.
export function useSelfReportedCourse(
  repository: MedicationRepository,
  session: ProfileSession,
  profileId: string,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [state, setState] = useState<State>(initial);
  const submit = async (request: CreateSelfReportedCourseRequest) => {
    if (busy.current || session.role !== 'main' || !session.family) return;
    busy.current = true;
    const snapshot = structuredClone(request);
    setState({ pending: true, error: null, saved: null, request: snapshot });
    try {
      const saved = await repository.create(profileId, snapshot, session.csrfToken);
      await client.invalidateQueries({
        queryKey: ['medications', session.account.id, session.family.id, profileId],
      });
      setState({ pending: false, error: null, saved, request: snapshot });
    } catch (cause) {
      const error =
        cause instanceof MedicationRequestError
          ? cause
          : new MedicationRequestError('Không thể lưu thuốc bổ. Vui lòng thử lại.', 0);
      setState({ pending: false, error, saved: null, request: snapshot });
      if (error.status === 401 || error.status === 403)
        void client.invalidateQueries({ queryKey: ['current-session'] });
    } finally {
      busy.current = false;
    }
  };
  const prompt =
    state.error?.code === 'ERR_COURSE_CONFLICT_UNRESOLVED' &&
    state.error.conflicts.length > 0 &&
    state.request
      ? { request: state.request, conflicts: state.error.conflicts }
      : null;
  return {
    ...state,
    prompt,
    submit,
    reset: () => {
      if (!busy.current) setState(initial);
    },
  };
}
