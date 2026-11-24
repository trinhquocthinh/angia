import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/account/')({
  component: lazyRouteComponent(
    () => import('@src/features/account/presentation/settings/AccountSettingsPage'),
    'AccountSettingsPage',
  ),
});
