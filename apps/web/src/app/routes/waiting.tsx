import { createFileRoute } from '@tanstack/react-router';
import { HouseholdStartPage } from '@src/features/household/presentation/start/HouseholdStartPage';

export const Route = createFileRoute('/waiting')({
  validateSearch: (search: Record<string, unknown>): { step?: 'create' | 'join' } =>
    search['step'] === 'create' || search['step'] === 'join' ? { step: search['step'] } : {},
  component: function WaitingRoute() {
    return (
      <HouseholdStartPage
        create={Route.useSearch().step === 'create'}
        join={Route.useSearch().step === 'join'}
      />
    );
  },
});
