import { createRootRoute, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-8">
      <Outlet />
    </main>
  ),
});
