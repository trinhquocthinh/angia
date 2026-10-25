import { createFileRoute } from '@tanstack/react-router';
import { ReviewPage } from '@src/features/documents/presentation/ReviewPage';
export const Route = createFileRoute('/review/$documentId')({
  component: function ReviewDocumentRoute() {
    const { documentId } = Route.useParams();
    return <ReviewPage key={documentId} documentId={documentId} />;
  },
});
