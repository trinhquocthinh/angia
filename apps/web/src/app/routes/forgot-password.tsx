import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordPage } from '@src/features/account/presentation/password/ForgotPasswordPage';

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage });
