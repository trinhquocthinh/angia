import { createFileRoute } from '@tanstack/react-router';
import { UploadPage } from '@src/features/documents/presentation/UploadPage';
export const Route = createFileRoute('/upload')({ component: UploadPage });
