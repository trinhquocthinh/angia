import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '@src/features/auth/presentation/LoginPage';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { error?: 'auth' } =>
    search['error'] === 'auth' ? { error: 'auth' } : {},
  component: LoginRoute,
});

function LoginRoute() {
  const { error } = Route.useSearch();
  return <LoginPage hasAuthError={error === 'auth'} />;
}
