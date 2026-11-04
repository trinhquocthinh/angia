import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { refreshTemperatureViews } from './refreshTemperatureViews';

export type TemperatureMutationResult = 'saved' | 'confirm' | 'failed';
export function useTemperatureMutation(session: ProfileSession, profileId: string) {
  const client = useQueryClient();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>): Promise<TemperatureMutationResult> => {
    if (busy.current || session.role !== 'main' || !session.family) return 'failed';
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
      await refreshTemperatureViews(client, session, profileId);
      return 'saved';
    } catch (cause) {
      const failure = cause instanceof MedicationRequestError ? cause : null;
      if (failure?.status === 422 && failure.code === 'ERR_OUT_OF_RANGE_UNCONFIRMED') return 'confirm';
      setError(failure?.message ?? 'Không thể hoàn tất thao tác. Vui lòng thử lại.');
      if (failure && [401, 403, 404, 409].includes(failure.status)) {
        await refreshTemperatureViews(client, session, profileId);
        void client.invalidateQueries({ queryKey: ['current-session'] });
        void client.invalidateQueries({ queryKey: profileScopeKey(session) });
      }
      return 'failed';
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return { pending, error, run };
}
