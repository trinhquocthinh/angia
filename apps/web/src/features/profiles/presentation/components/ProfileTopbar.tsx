import { Link, useNavigate } from '@tanstack/react-router';
import { HeaderSearch } from '@src/shared/ui/HeaderSearch';
import { filterByName } from '@src/shared/utils/text/filterByName';
import type { HealthProfile } from '../../application/ports';
import { ProfileIcon } from './ProfileIcon';

// Header: tìm hồ sơ thành viên theo tên (lọc phía client) và lối tắt tới cài đặt thông báo trên thiết bị.
export function ProfileTopbar({ profiles, hasFamily }: { profiles: HealthProfile[]; hasFamily: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[#e4f0ef] px-4 py-3 lg:px-8">
      <a href="/" className="shrink-0 text-sm font-semibold text-[#004135]">
        Hồ Sơ Sức Khỏe Gia Đình
      </a>
      <div className="flex min-w-0 items-center gap-2">
        <HeaderSearch
          className="hidden w-72 sm:block"
          label="Tìm hồ sơ thành viên"
          placeholder="Tìm hồ sơ thành viên…"
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
        {hasFamily && (
          <Link
            to="/notifications"
            aria-label="Cài đặt thông báo"
            title="Cài đặt thông báo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#55615f] transition-colors hover:bg-[#e4f0f0] hover:text-[#004135] focus-visible:outline-2 focus-visible:outline-[#286958]"
          >
            <ProfileIcon name="bell" />
          </Link>
        )}
      </div>
    </header>
  );
}
