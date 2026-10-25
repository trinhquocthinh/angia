import { createFileRoute } from '@tanstack/react-router';
import { NewProfilePage } from '@src/features/profiles/presentation/NewProfilePage';
export const Route = createFileRoute('/profiles/new')({ component: NewProfilePage });
