import { createFileRoute } from '@tanstack/react-router';
import { ReviewPage } from '@src/features/documents/presentation/ReviewPage';
export const Route = createFileRoute('/review/')({ component: () => <ReviewPage /> });
