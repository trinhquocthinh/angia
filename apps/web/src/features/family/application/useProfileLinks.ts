import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileLinkAdminRepository } from './ports';

// SPEC-050: chỉ tải khi quản trị chọn một nhóm, tránh đọc tên hồ sơ của mọi gia đình.
export function useProfileLinks(repository: ProfileLinkAdminRepository, csrfToken: string, familyId: string) {
  const client = useQueryClient();
  const key = ['admin', 'profile-links', familyId];
  const profiles = useQuery({
    queryKey: key,
    enabled: Boolean(familyId),
    retry: false,
    queryFn: ({ signal }) => repository.list(familyId, signal),
  });
  const change = useMutation({
    retry: false,
    mutationFn: ({ profileId, accountId }: { profileId: string; accountId: string | null }) =>
      repository.setLinkedAccount(familyId, profileId, accountId, csrfToken),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
  return { profiles, change };
}
