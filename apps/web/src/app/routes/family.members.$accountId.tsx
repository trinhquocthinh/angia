import { createFileRoute } from '@tanstack/react-router';
import { HouseholdMemberDetailPage } from '@src/features/household/presentation/members/HouseholdMemberDetailPage';

function HouseholdMemberDetailRoute() {
  const { accountId } = Route.useParams();
  return <HouseholdMemberDetailPage key={accountId} accountId={accountId} />;
}

export const Route = createFileRoute('/family/members/$accountId')({
  component: HouseholdMemberDetailRoute,
});
