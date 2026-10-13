import { useQuery } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { AdherenceRepository } from './ports';

// Khóa ['adherence', tài khoản, gia đình, hồ sơ] để lưu giai đoạn xong làm mới danh sách trong sheet.
export function useAdherencePeriods(
  repository: AdherenceRepository,
  session: ProfileSession,
  profile: HealthProfile,
) {
  return useQuery({
    queryKey: ['adherence', session.account.id, session.family?.id, profile.id],
    queryFn: ({ signal }) => repository.list(profile.id, signal),
    enabled: session.role === 'main' && Boolean(session.family) && profile.consentStatus === 'confirmed',
    retry: false,
  });
}
