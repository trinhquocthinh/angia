import { createFileRoute } from '@tanstack/react-router';
import { RegisterPage } from '@src/features/account/presentation/RegisterPage';
export const Route = createFileRoute('/register')({ component: RegisterPage });
