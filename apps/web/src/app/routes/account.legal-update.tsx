import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/account/legal-update')({
  component: lazyRouteComponent(
    () => import('@src/features/account/presentation/LegalUpdatePage'),
    'LegalUpdatePage',
  ),
});
