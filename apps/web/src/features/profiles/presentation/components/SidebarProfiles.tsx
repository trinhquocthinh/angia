import { Link } from '@tanstack/react-router';
import type { HealthProfile } from '../../application/ports';

// Tên hồ sơ dẫn tới trang hồ sơ (tab Diễn biến sức khỏe, E2-S6-T1).
export function SidebarProfiles({ profiles }: { profiles: HealthProfile[] }) {
  return (
    <div className="mt-7 hidden lg:block">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#55615f]">Hồ sơ gia đình</p>
      <ul className="mt-4 space-y-2">
        {profiles.map((profile) => (
          <li key={profile.id}>
            <Link
              to="/profiles/$profileId"
              params={{ profileId: profile.id }}
              className="flex min-h-9 items-center gap-2 rounded-xl px-1 text-sm hover:bg-[#e4f0f0] focus-visible:outline-2 focus-visible:outline-[#286958]"
              activeProps={{ className: 'font-semibold text-[#004135]' }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b3eddf]"
                aria-hidden="true"
              >
                {profile.displayName.slice(0, 1)}
              </span>
              <span className="min-w-0 break-words">{profile.displayName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
