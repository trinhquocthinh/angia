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
      <div role="alert" className="profile-bento-card p-8">
        <p>Không thể tải hồ sơ gia đình.</p>
        <button
          type="button"
          className="mt-4 inline-flex min-h-btn cursor-pointer items-center justify-center rounded-2xl bg-accent px-5 py-3 text-button-primary font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
          onClick={retry}
        >
          Thử lại
        </button>
      </div>
    );
  if (!profiles.length) return <ProfilesEmpty />;
  return (
    <section aria-label="Danh sách hồ sơ" className="py-1">
      <div className="grid gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
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
