import { ProfileIcon } from './ProfileIcon';
import { AddProfileTile } from './AddProfileTile';
import { Link } from '@tanstack/react-router';
import type { HealthProfile } from '../../application/ports';
import { ProfileCard } from './ProfileCard';
type ProfilesContentProps = {
  profiles: HealthProfile[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  onConsent: (profile: HealthProfile) => void;
};
export function ProfilesContent({ profiles, loading, error, retry, onConsent }: ProfilesContentProps) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tải hồ sơ" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="h-[280px] animate-pulse rounded-[20px] bg-white motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="rounded-2xl bg-white p-8">
        <p>Không thể tải hồ sơ gia đình.</p>
        <button
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] mt-4"
          onClick={retry}
        >
          Thử lại
        </button>
      </div>
    );
  if (!profiles.length)
    return (
      <section className="rounded-[20px] bg-white px-6 py-16 text-center">
        <span aria-hidden="true" className="inline-flex text-[#286958]">
          <ProfileIcon name="home" size={48} />
        </span>
        <h2 className="auth-heading mt-5 text-2xl text-[#004135]">Tạo hồ sơ đầu tiên cho người bạn chăm</h2>
        <p className="mt-3 text-sm text-[#55615f]">Một nơi để lưu giữ thông tin sức khỏe của người thân.</p>
        <Link
          to="/profiles/new"
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] mt-6 inline-flex"
        >
          Tạo hồ sơ
        </Link>
      </section>
    );
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} onConsent={onConsent} />
      ))}
      <AddProfileTile />
    </div>
  );
}
