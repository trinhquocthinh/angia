import { revealStyle } from '@src/shared/ui/revealStyle';
import { ProfilesEmpty } from './ProfilesEmpty';
import { ProfilesSkeleton } from './ProfilesSkeleton';
import { AddProfileTile } from './AddProfileTile';
import type { ProfileListItem } from '../../application/ports';
import { ProfileCard } from './ProfileCard';
type ProfilesContentProps = {
  profiles: ProfileListItem[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  onConsent: (profile: ProfileListItem) => void;
  onLink: (profile: ProfileListItem) => void;
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
  onLink,
  onDelete,
  ownProfileId,
  onWithdraw,
}: ProfilesContentProps) {
  if (loading) return <ProfilesSkeleton />;
  if (error)
    return (
      <div role="alert" className="rounded-2xl bg-surface p-8">
        <p>Không thể tải hồ sơ gia đình.</p>
        <button
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-center text-sm font-semibold text-on-accent cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus mt-4"
          onClick={retry}
        >
          Thử lại
        </button>
      </div>
    );
  if (!profiles.length) if (!profiles.length) return <ProfilesEmpty />;
  return (
    <section className="flex flex-col gap-6 py-2 lg:py-0">
      <h2 className="auth-heading hidden text-2xl leading-8 font-semibold tracking-tight text-accent lg:block">
        Hồ sơ thành viên gia đình
      </h2>
      <div className="grid gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {/* §11.4.1: thẻ tới so le sau skeleton; vỏ `grid` để thẻ vẫn giãn bằng hàng. */}
        {profiles.map((profile, index) => (
          <div key={profile.id} className="angia-enter grid" style={revealStyle(index)}>
            <ProfileCard
              profile={profile}
              onConsent={onConsent}
              onLink={onLink}
              onDelete={onDelete}
              onWithdraw={profile.id === ownProfileId ? onWithdraw : undefined}
            />
          </div>
        ))}
        <div className="angia-enter grid" style={revealStyle(profiles.length)}>
          <AddProfileTile />
        </div>
      </div>
    </section>
  );
}
