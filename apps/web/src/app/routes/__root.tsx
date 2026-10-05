import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AuthBoundary } from '@src/features/auth/presentation/AuthBoundary';

export const Route = createRootRoute({
  component: () => (
    <main className="min-h-dvh">
      <AuthBoundary>
        <Outlet />
      </AuthBoundary>
    </main>
  ),
});
