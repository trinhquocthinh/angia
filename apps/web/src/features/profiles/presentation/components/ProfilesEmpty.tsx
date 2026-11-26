import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Gia đình chưa có hồ sơ nào: dùng icon 3D đất sét thẻ hồ sơ, một câu ngắn và một nút chính.
export function ProfilesEmpty() {
  return (
    <section className="profile-bento-card flex flex-col items-center px-6 py-14 text-center">
      <img
        src="/images/account-menu/profile-card-3d.png"
        alt=""
        width="72"
        height="72"
        className="profile-clay-icon h-[72px] w-[72px]"
      />
      <h2 className="auth-heading mt-4 text-heading-2 font-semibold text-accent">
        Tạo hồ sơ đầu tiên cho người bạn chăm
      </h2>
      <Link
        to="/profiles/new"
        className="mt-5 inline-flex min-h-btn cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-button-primary font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
      >
        <AdminIcon name="person_add" size={20} />
        Tạo hồ sơ
      </Link>
    </section>
  );
}
