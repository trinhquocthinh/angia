import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MedicationCourse, ReusePrescriptionRequest } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { DocumentEntriesRepository } from './documentEntryPorts';
import { ReviewRequestError } from './ReviewRequestError';

type State = {
  pending: boolean;
  saved: MedicationCourse[] | null;
  error: ReviewRequestError | null;
  request: ReusePrescriptionRequest | null;
};
const initial: State = { pending: false, saved: null, error: null, request: null };

// SPEC-029: giữ bản đã gửi để đối soát Thay thế/Song song; ref chặn bấm hai lần trước lần render kế.
// Lưu xong làm mới danh mục thuốc và danh mục chứng từ của đúng hồ sơ.
export function useReusePrescription(
  repository: DocumentEntriesRepository,
  session: ProfileSession,
  profileId: string,
  prescriptionId: string,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [state, setState] = useState<State>(initial);
  const submit = async (request: ReusePrescriptionRequest) => {
    if (busy.current || session.role !== 'main' || !session.family) return false;
    busy.current = true;
    const snapshot = structuredClone(request);
    setState({ pending: true, saved: null, error: null, request: snapshot });
    try {
      const saved = await repository.reuse(profileId, prescriptionId, snapshot, session.csrfToken);
      const scope = [session.account.id, session.family.id, profileId];
      await Promise.all([
        client.invalidateQueries({ queryKey: ['medications', ...scope] }),
        client.invalidateQueries({ queryKey: ['documents', ...scope] }),
      ]);
      setState({ pending: false, saved, error: null, request: snapshot });
      return true;
    } catch (cause) {
      const error =
        cause instanceof ReviewRequestError
          ? cause
          : new ReviewRequestError('Không thể tạo đợt thuốc. Vui lòng thử lại.', 0);
      setState({ pending: false, saved: null, error, request: snapshot });
      if (error.status === 401 || error.status === 403)
        void client.invalidateQueries({ queryKey: ['current-session'] });
      return false;
    } finally {
      busy.current = false;
    }
  };
  const conflicts = state.error?.code === 'ERR_COURSE_CONFLICT_UNRESOLVED' ? state.error.courseConflicts : [];
  const prompt = conflicts.length > 0 && state.request ? { request: state.request, conflicts } : null;
  return {
    ...state,
    prompt,
    submit,
    reset: () => {
      if (!busy.current) setState(initial);
    },
  };
}
