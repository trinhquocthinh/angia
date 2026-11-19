import { Outlet, createFileRoute, useChildMatches } from '@tanstack/react-router';
import { HouseholdMembersPage } from '@src/features/household/presentation/members/HouseholdMembersPage';
import { MemberToastProvider } from '@src/features/household/presentation/members/memberToastContext';

function HouseholdMembersRoute() {
  const hasChild = useChildMatches({ select: (matches) => matches.length > 0 });
  return <MemberToastProvider>{hasChild ? <Outlet /> : <HouseholdMembersPage />}</MemberToastProvider>;
}

export const Route = createFileRoute('/family/members')({ component: HouseholdMembersRoute });
