import { createFileRoute } from '@tanstack/react-router';
import { AdminPage } from '@src/features/family/presentation/AdminPage';

export const Route = createFileRoute('/admin')({ component: AdminPage });
