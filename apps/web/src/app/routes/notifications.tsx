import { createFileRoute } from '@tanstack/react-router';
import { PushSettingsPage } from '@src/features/pushSubscriptions/presentation/PushSettingsPage';
export const Route = createFileRoute('/notifications')({ component: PushSettingsPage });
