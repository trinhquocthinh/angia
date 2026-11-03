import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import type { DoseConfirmationRepository } from './ports';
import { profileDayRemindersKey } from './profileDayRemindersKey';

// Khóa theo ngày Việt Nam vì "hôm nay" do API tính; quyền bấm đọc lại mỗi lần tải (Design §9.6).
export function useProfileDayReminders(
  repository: DoseConfirmationRepository,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...profileDayRemindersKey(session), profile.id, vietnamDate()],
    enabled: session.role === 'main' && Boolean(session.family) && profile.consentStatus === 'confirmed',
    retry: false,
    queryFn: ({ signal }) => repository.listForProfile(profile.id, signal),
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403].includes(query.error.status))
      void client.invalidateQueries({ queryKey: ['current-session'] });
  }, [client, query.error]);
  return query;
}
