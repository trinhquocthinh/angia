import { useNavigate } from '@tanstack/react-router';
import { HeaderSearch } from '@src/shared/ui/HeaderSearch';
import { filterByName } from '@src/shared/utils/text/filterByName';
import type { HealthProfile } from '../../application/ports';

// Tìm hồ sơ thành viên theo tên (lọc phía client), chọn để mở trang hồ sơ.
export function ProfileSearch({
  profiles,
  className = '',
}: {
  profiles: HealthProfile[];
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <HeaderSearch
      className={className}
      label="Tìm hồ sơ thành viên"
      placeholder="Tìm kiếm hồ sơ thành viên…"
      emptyText="Không có hồ sơ trùng tên."
      search={(query) =>
        filterByName(profiles, query, (profile) => profile.displayName).map((profile) => ({
          id: profile.id,
          label: profile.displayName,
          hint: profile.birthYear ? `Năm sinh ${profile.birthYear}` : undefined,
        }))
      }
      onSelect={(item) => void navigate({ to: '/profiles/$profileId', params: { profileId: item.id } })}
    />
  );
}
