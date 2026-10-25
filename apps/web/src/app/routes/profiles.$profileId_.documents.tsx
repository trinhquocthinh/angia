import { createFileRoute } from '@tanstack/react-router';
import { DocumentsPage } from '@src/features/documents/presentation/DocumentsPage';
export const Route = createFileRoute('/profiles/$profileId_/documents')({
  component: function DocumentsRoute() {
    const { profileId } = Route.useParams();
    return <DocumentsPage key={profileId} profileId={profileId} />;
  },
});
