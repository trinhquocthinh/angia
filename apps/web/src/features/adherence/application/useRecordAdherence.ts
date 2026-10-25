import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { AdherenceRequestError } from './AdherenceRequestError';
import type { AdherencePeriod, AdherenceRepository, RecordAdherenceRequest } from './ports';

type State = { pending: boolean; saved: AdherencePeriod | null; error: AdherenceRequestError | null };
const initial: State = { pending: false, saved: null, error: null };

// Lưu xong làm mới chuỗi biểu đồ (khóa 'measurements') và danh sách giai đoạn của đúng hồ sơ.
export function useRecordAdherence(
  repository: AdherenceRepository,
  session: ProfileSession,
  profileId: string,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [state, setState] = useState<State>(initial);
  const submit = async (request: RecordAdherenceRequest, onSaved: (period: AdherencePeriod) => void) => {
    if (busy.current || session.role !== 'main' || !session.family) return false;
    busy.current = true;
    setState({ pending: true, saved: null, error: null });
    try {
      const saved = await repository.record(profileId, request, session.csrfToken);
      const scope = [session.account.id, session.family.id, profileId];
      await Promise.all([
        client.invalidateQueries({ queryKey: ['measurements', ...scope] }),
        client.invalidateQueries({ queryKey: ['adherence', ...scope] }),
      ]);
      setState({ pending: false, saved, error: null });
      onSaved(saved);
      return true;
    } catch (cause) {
      const error =
        cause instanceof AdherenceRequestError
          ? cause
          : new AdherenceRequestError('Không thể lưu giai đoạn dùng thuốc. Vui lòng thử lại.', 0);
      setState({ pending: false, saved: null, error });
      if (error.status === 401 || error.status === 403)
        void client.invalidateQueries({ queryKey: ['current-session'] });
      return false;
    } finally {
      busy.current = false;
    }
  };
  return { ...state, submit };
}
