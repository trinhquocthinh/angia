import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';

type SettingIo<T, V> = {
  load(profileId: string, signal?: AbortSignal): Promise<T>;
  store(profileId: string, value: V, csrfToken: string): Promise<T>;
};

// Cấu hình nhắc thuốc của hồ sơ (SPEC-025 khung giờ, SPEC-026 người nhận): khóa cache theo
// tài khoản/gia đình/hồ sơ để không lẫn phiên; mất phiên/quyền/đồng thuận thì tải lại phiên và hồ sơ.
export function useReminderSetting<T, V>(
  name: string,
  io: SettingIo<T, V>,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const client = useQueryClient();
  const key = [name, session.account.id, session.family?.id, profile.id];
  const query = useQuery({
    queryKey: key,
    enabled: session.role === 'main' && profile.consentStatus === 'confirmed',
    retry: false,
    queryFn: ({ signal }) => io.load(profile.id, signal),
  });
  const save = useMutation({
    retry: false,
    mutationFn: (value: V) => io.store(profile.id, value, session.csrfToken),
    onSuccess: (saved) => client.setQueryData(key, saved),
    onError: async (error) => {
      if (!(error instanceof MedicationRequestError)) return;
      if (error.status === 401 || error.status === 403 || error.code === 'ERR_CONSENT_REQUIRED') {
        await client.invalidateQueries({ queryKey: ['current-session'] });
        await client.invalidateQueries({ queryKey: ['profiles'] });
      }
    },
  });
  return { query, save };
}
