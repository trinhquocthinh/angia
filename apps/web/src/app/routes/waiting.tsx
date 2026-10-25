import { createFileRoute } from '@tanstack/react-router';
import { WaitingPage } from '@src/features/auth/presentation/WaitingPage';

export const Route = createFileRoute('/waiting')({ component: WaitingPage });
