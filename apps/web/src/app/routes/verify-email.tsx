import { createFileRoute } from '@tanstack/react-router';
import { VerifyEmailPage } from '@src/features/account/presentation/verify/VerifyEmailPage';

export const Route = createFileRoute('/verify-email')({ component: VerifyEmailPage });
