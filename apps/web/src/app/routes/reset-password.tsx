import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordPage } from '@src/features/account/presentation/password/ResetPasswordPage';

export const Route = createFileRoute('/reset-password')({ component: ResetPasswordPage });
