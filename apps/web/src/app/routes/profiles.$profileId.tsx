import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ProfileOverviewPage } from '@src/features/profiles/presentation/ProfileOverviewPage';
const ProfileHealthPage = lazy(() =>
  import('@src/features/measurements/presentation/ProfileHealthPage').then((module) => ({
    default: module.ProfileHealthPage,
  })),
);

export const Route = createFileRoute('/profiles/$profileId')({
  validateSearch: (search: Record<string, unknown>): { section?: 'health' } =>
    search.section === 'health' ? { section: 'health' } : {},
  component: function ProfileHealthRoute() {
    const { profileId } = Route.useParams();
    const { section } = Route.useSearch();
    return section === 'health' ? (
      <Suspense
        fallback={
          <p role="status" className="p-6 text-body">
            Đang tải số đo…
          </p>
        }
      >
        <ProfileHealthPage key={profileId} profileId={profileId} />
      </Suspense>
    ) : (
      <ProfileOverviewPage key={profileId} profileId={profileId} />
    );
  },
});
