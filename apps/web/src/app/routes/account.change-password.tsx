import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/account/change-password')({
  component: lazyRouteComponent(
    () => import('@src/features/account/presentation/ChangePasswordPage'),
    'ChangePasswordPage',
  ),
});
