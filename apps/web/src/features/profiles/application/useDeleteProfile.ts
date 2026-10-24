import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfilesRepository, ProfileSession } from './ports';
import { ProfileRequestError } from './ProfileRequestError';
import { profileScopeKey } from './profileScopeKey';
import { useProfileSessionRecovery } from './useProfileSessionRecovery';
export type DeleteOutcome = 'deleted' | 'mismatch' | 'failed';
// SPEC-007: server quyết định tên có khớp; xóa xong gỡ mọi cache mang id hồ sơ để không còn dữ liệu cũ.
export function useDeleteProfile(repository: ProfilesRepository, session: ProfileSession) {
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sending = useRef(false);
  useProfileSessionRecovery(error);
  const submit = async (profile: HealthProfile, confirmName: string): Promise<DeleteOutcome> => {
    if (sending.current || session.role !== 'main' || !session.csrfToken) return 'failed';
    sending.current = true;
    setPending(true);
    setMismatch(false);
    setError(null);
    try {
      await repository.remove(profile.id, confirmName, session.csrfToken);
      client.removeQueries({ predicate: (query) => query.queryKey.includes(profile.id) });
      await client.invalidateQueries({ queryKey: profileScopeKey(session) });
      return 'deleted';
    } catch (caught) {
      if (caught instanceof ProfileRequestError && caught.code === 'ERR_CONFIRMATION_MISMATCH') {
        setMismatch(true);
        return 'mismatch';
      }
      setError(caught instanceof Error ? caught : new Error('Không xóa được hồ sơ.'));
      return 'failed';
    } finally {
      sending.current = false;
      setPending(false);
    }
  };
  const reset = () => {
    setMismatch(false);
    setError(null);
  };
  return { submit, pending, mismatch, error, reset };
}
