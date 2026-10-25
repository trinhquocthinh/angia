import { useQuery } from '@tanstack/react-query';
import type { FamilyUsageRepository } from './ports';

export const FAMILY_USAGE_KEY = ['family-usage'];

// SPEC-030: mức dùng của gia đình cho trang tải ảnh; lỗi tải chỉ ẩn thẻ, không chặn tải ảnh.
export function useFamilyUsage(repository: FamilyUsageRepository, enabled: boolean) {
  return useQuery({
    queryKey: FAMILY_USAGE_KEY,
    enabled,
    retry: false,
    queryFn: ({ signal }) => repository.get(signal),
  });
}
