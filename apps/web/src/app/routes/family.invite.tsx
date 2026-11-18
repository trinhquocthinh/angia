import { createFileRoute } from '@tanstack/react-router';
import { HouseholdInvitationPage } from '@src/features/household/presentation/invite/HouseholdInvitationPage';

export const Route = createFileRoute('/family/invite')({ component: HouseholdInvitationPage });
