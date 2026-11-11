import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { TemperatureWorkspace } from '@src/features/temperatures/presentation/TemperatureWorkspace';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { useProfileTimeline } from '../application/useProfileTimeline';
import { createTimelineRepository } from '../infrastructure/createTimelineRepository';
import { TimelineFeed } from './TimelineFeed';

const repository = createTimelineRepository();

export function TimelineContent({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  const query = useProfileTimeline(repository, session, profile);
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHealthHeader profile={profile} session={session} active="timeline" />
      <section className="rounded-xl bg-surface p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-accent">Dòng thời gian</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Các sự kiện sức khỏe đã ghi nhận, từ mới nhất đến trước đó.
        </p>
      </section>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-xl bg-surface p-6 text-sm">
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
