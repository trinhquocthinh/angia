import { createRootRoute, Outlet } from '@tanstack/react-router';
import { SessionBoundary } from '@src/features/auth/presentation/SessionBoundary';

export const Route = createRootRoute({
  component: () => (
    <main className="min-h-dvh">
      <SessionBoundary>
        <Outlet />
      </SessionBoundary>
    </main>
  ),
});
