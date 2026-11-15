import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/account/local-password')({
  component: lazyRouteComponent(
    () => import('@src/features/account/presentation/LocalPasswordPage'),
    'LocalPasswordPage',
  ),
});
