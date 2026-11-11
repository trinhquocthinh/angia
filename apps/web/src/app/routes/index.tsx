import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@src/features/profiles/presentation/HomePage';
import { TodayPage } from '@src/features/today/presentation/TodayPage';

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { view?: 'profiles' } =>
    search['view'] === 'profiles' ? { view: 'profiles' } : {},
  component: function IndexRoute() {
    return Route.useSearch().view === 'profiles' ? <HomePage /> : <TodayPage />;
  },
});
