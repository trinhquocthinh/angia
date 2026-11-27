import { createFileRoute } from '@tanstack/react-router';
import { HouseholdInvitationLinkPage } from '@src/features/household/presentation/invite/HouseholdInvitationLinkPage';

export const Route = createFileRoute('/invite')({ component: HouseholdInvitationLinkPage });
