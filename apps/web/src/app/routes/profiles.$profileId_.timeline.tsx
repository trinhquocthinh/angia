import { createFileRoute } from '@tanstack/react-router';
import { TimelinePage } from '@src/features/timeline/presentation/TimelinePage';

export const Route = createFileRoute('/profiles/$profileId_/timeline')({
  component: function TimelineRoute() {
    const { profileId } = Route.useParams();
    return <TimelinePage key={profileId} profileId={profileId} />;
  },
});
