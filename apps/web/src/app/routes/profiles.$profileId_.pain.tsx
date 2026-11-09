import { createFileRoute } from '@tanstack/react-router';
import { PainJournalPage } from '@src/features/painJournal/presentation/PainJournalTab/PainJournalPage';

export const Route = createFileRoute('/profiles/$profileId_/pain')({
  component: function PainJournalRoute() {
    const { profileId } = Route.useParams();
    return <PainJournalPage key={profileId} profileId={profileId} />;
  },
});
