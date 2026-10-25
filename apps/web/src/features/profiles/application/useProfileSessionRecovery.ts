import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileRequestError } from './ProfileRequestError';
export function useProfileSessionRecovery(error: Error | null) {
  const client = useQueryClient();
  useEffect(() => {
    if (error instanceof ProfileRequestError && (error.status === 401 || error.status === 403)) {
      void client.invalidateQueries({ queryKey: ['current-session'] });
    }
  }, [client, error]);
}
