import { CURRENT_SESSION_KEY } from '@src/features/auth/application/useCurrentSession';
export async function completeAccountAccess(
  invalidate: (options: { queryKey: typeof CURRENT_SESSION_KEY }) => Promise<unknown>,
  navigate: (options: { to: '/'; replace: true }) => Promise<unknown>,
) {
  await invalidate({ queryKey: CURRENT_SESSION_KEY });
  await navigate({ to: '/', replace: true });
}
