import { createFileRoute } from '@tanstack/react-router';
import { HouseholdStartPage } from '@src/features/household/presentation/start/HouseholdStartPage';

export const Route = createFileRoute('/waiting')({
  validateSearch: (search: Record<string, unknown>): { step?: 'create' } =>
    search['step'] === 'create' ? { step: 'create' } : {},
  component: function WaitingRoute() {
    return <HouseholdStartPage create={Route.useSearch().step === 'create'} />;
  },
});
