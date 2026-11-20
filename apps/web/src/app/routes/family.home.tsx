import { createFileRoute } from '@tanstack/react-router';
import { HouseholdHomePage } from '@src/features/household/presentation/home/HouseholdHomePage';
import { MemberToastProvider } from '@src/features/household/presentation/members/memberToastContext';

function HouseholdHomeRoute() {
  return (
    <MemberToastProvider>
      <HouseholdHomePage />
    </MemberToastProvider>
  );
}

export const Route = createFileRoute('/family/home')({ component: HouseholdHomeRoute });
