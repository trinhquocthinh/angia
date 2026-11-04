import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { refreshDoseViews } from './refreshDoseViews';

export function useAsNeededDoseMutation(session: ProfileSession, profileId: string) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>) => {
    if (busy.current || session.role !== 'main' || !session.family) return false;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
      await refreshDoseViews(client, session, profileId);
      return true;
    } catch (cause) {
      const failure = cause instanceof MedicationRequestError ? cause : null;
      setError(failure?.message ?? 'Không thể hoàn tất thao tác. Vui lòng thử lại.');
      if (failure && [401, 403, 404, 409, 422].includes(failure.status)) {
        await refreshDoseViews(client, session, profileId);
        if (failure.status !== 422) {
          void client.invalidateQueries({ queryKey: ['current-session'] });
          void client.invalidateQueries({ queryKey: profileScopeKey(session) });
        }
      }
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return { pending, error, run };
}
