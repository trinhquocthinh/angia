import { createFileRoute } from '@tanstack/react-router';
import { ConsentInvitePage } from '@src/features/profiles/presentation/ConsentInvitePage';
export const Route = createFileRoute('/consent-invite')({ component: ConsentInvitePage });
