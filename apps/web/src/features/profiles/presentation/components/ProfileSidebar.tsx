import { ProfileIcon } from './ProfileIcon';
import { ProfileAccountFooter } from './ProfileAccountFooter';
import { Link } from '@tanstack/react-router';
import type { HealthProfile, ProfileSession } from '../../application/ports';
type ProfileSidebarProps = {
  session: ProfileSession;
  profiles: HealthProfile[];
  pending: boolean;
  error: boolean;
  onLogout: () => void;
};
const navItem =
  'flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] max-md:px-2 max-md:text-xs';
const active = { className: 'bg-[#004135] text-white' };
const idle = { className: 'text-[#55615f] hover:bg-[#e4f0f0]' };
export function ProfileSidebar({ session, profiles, pending, error, onLogout }: ProfileSidebarProps) {
  return (
    <aside className="flex flex-col bg-[#eaf6f5] p-4 lg:fixed lg:inset-y-0 lg:w-[240px] lg:overflow-y-auto">
      <a href="/" className="flex items-center gap-2 font-bold text-[#004135]">
        <img src="/logo.png" alt="" className="h-12 w-12 object-contain" />
        <span>
          AN GIA<small className="block text-[10px] uppercase tracking-wider">Sổ sức khỏe gia đình</small>
        </span>
      </a>
      <p className="mt-3 hidden text-xs italic leading-5 text-[#55615f] lg:block">
        “Chăm chút từng thói quen, chở che từng thế hệ.”
      </p>
      <nav aria-label="Điều hướng chính" className="mt-5 flex gap-2 lg:flex-col">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className={navItem}
          activeProps={active}
          inactiveProps={idle}
        >
          <ProfileIcon name="home" /> Nhà (Gia đình)
        </Link>
        <Link to="/upload" className={navItem} activeProps={active} inactiveProps={idle}>
          <ProfileIcon name="upload" /> Thêm (Tải ảnh)
        </Link>
        <button
          disabled
          className="flex min-h-11 items-center rounded-xl px-3 py-2 text-left text-sm font-medium disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] max-md:px-2 max-md:text-xs text-[#55615f]"
        >
          Chờ duyệt
        </button>
      </nav>
      <div className="mt-7 hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#55615f]">Hồ sơ gia đình</p>
        <ul className="mt-4 space-y-4">
          {profiles.map((profile) => (
            <li key={profile.id} className="flex items-center gap-2 text-sm">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b3eddf]"
                aria-hidden="true"
              >
                {profile.displayName.slice(0, 1)}
              </span>
              <span className="min-w-0 break-words">{profile.displayName}</span>
            </li>
          ))}
        </ul>
      </div>
      <ProfileAccountFooter session={session} pending={pending} error={error} onLogout={onLogout} />
    </aside>
  );
}
