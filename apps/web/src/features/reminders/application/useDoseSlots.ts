import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { DoseSlotRepository, DoseSlotTimes } from './ports';

// SPEC-025: đọc/ghi khung giờ buổi; khóa cache theo tài khoản/gia đình/hồ sơ để không lẫn phiên.
export function useDoseSlots(
  repository: DoseSlotRepository,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const client = useQueryClient();
  const key = ['dose-slots', session.account.id, session.family?.id, profile.id];
  const slots = useQuery({
    queryKey: key,
    enabled: session.role === 'main' && profile.consentStatus === 'confirmed',
    retry: false,
    queryFn: ({ signal }) => repository.get(profile.id, signal),
  });
  const save = useMutation({
    retry: false,
    mutationFn: (value: DoseSlotTimes) => repository.save(profile.id, value, session.csrfToken),
    onSuccess: (saved) => client.setQueryData(key, saved),
    onError: async (error) => {
      if (!(error instanceof MedicationRequestError)) return;
      if (error.status === 401 || error.status === 403 || error.code === 'ERR_CONSENT_REQUIRED') {
        await client.invalidateQueries({ queryKey: ['current-session'] });
        await client.invalidateQueries({ queryKey: ['profiles'] });
      }
    },
  });
  return { slots, save };
}
