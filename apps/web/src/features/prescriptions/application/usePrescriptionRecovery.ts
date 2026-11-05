import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';

export function usePrescriptionRecovery(error: unknown, session: ProfileSession) {
  const client = useQueryClient();
  useEffect(() => {
    if (error instanceof MedicationRequestError && [401, 403, 404, 409].includes(error.status)) {
      void client.invalidateQueries({ queryKey: ['current-session'] });
      void client.invalidateQueries({ queryKey: ['profiles', session.account.id, session.family?.id] });
    }
  }, [client, error, session.account.id, session.family?.id]);
}
