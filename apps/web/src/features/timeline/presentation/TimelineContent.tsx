import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { TemperatureWorkspace } from '@src/features/temperatures/presentation/TemperatureWorkspace';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { useProfileTimeline } from '../application/useProfileTimeline';
import { createTimelineRepository } from '../infrastructure/createTimelineRepository';
import { TimelineFeed } from './TimelineFeed';

const repository = createTimelineRepository();

export function TimelineContent({ profile, session }: { profile: ProfileListItem; session: ProfileSession }) {
  const query = useProfileTimeline(repository, session, profile);
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHealthHeader profile={profile} session={session} active="timeline" />
      <section className="profile-bento-card flex items-start gap-4 p-5 sm:p-6">
        <ProfileSectionIcon name="history" size={44} />
        <div className="min-w-0">
          <h2 className="auth-heading text-heading-2 font-semibold text-accent">Dòng thời gian</h2>
          <p className="mt-1 text-caption text-text-secondary">
            Các sự kiện sức khỏe đã ghi nhận, từ mới nhất đến trước đó.
          </p>
        </div>
      </section>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="profile-bento-card p-6 text-body text-text-primary">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <>
          <TemperatureWorkspace key={profile.id} session={session} profileId={profile.id} />
          <TimelineFeed
            profileId={profile.id}
            items={query.data?.pages.flatMap((page) => page.items)}
            loading={!query.data && !query.isError}
            error={query.error}
            fetchingMore={query.isFetchingNextPage}
            hasNextPage={query.hasNextPage}
            retry={() => void query.refetch()}
            loadMore={() => {
              if (!query.isFetching && query.hasNextPage) void query.fetchNextPage();
            }}
          />
        </>
      )}
    </div>
  );
}
