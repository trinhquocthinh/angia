import { ProfilesEmpty } from './ProfilesEmpty';
import { AddProfileTile } from './AddProfileTile';
import type { ProfileListItem } from '../../application/ports';
import { ProfileCard } from './ProfileCard';
type ProfilesContentProps = {
  profiles: ProfileListItem[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  onConsent: (profile: ProfileListItem) => void;
  onDelete: (profile: ProfileListItem) => void;
  ownProfileId?: string | null;
  onWithdraw?: () => void;
};
export function ProfilesContent({
  profiles,
  loading,
  error,
  retry,
  onConsent,
  onDelete,
  ownProfileId,
  onWithdraw,
}: ProfilesContentProps) {
  if (loading)
    return (
      <div
        role="status"
        aria-label="Đang tải hồ sơ"
        className="grid gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
      >
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="h-[280px] animate-pulse rounded-2xl lg:rounded-3xl bg-white motion-reduce:animate-none"
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
  if (!profiles.length) if (!profiles.length) return <ProfilesEmpty />;
  return (
    <section className="flex flex-col gap-6 py-2 lg:py-0">
      <h2 className="auth-heading hidden text-2xl leading-8 font-semibold tracking-tight text-[#004135] lg:block">
        Hồ sơ thành viên gia đình
      </h2>
      <div className="grid gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onConsent={onConsent}
            onDelete={onDelete}
            onWithdraw={profile.id === ownProfileId ? onWithdraw : undefined}
          />
        ))}
        <AddProfileTile />
      </div>
    </section>
  );
}
