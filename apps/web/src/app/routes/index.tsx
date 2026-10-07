import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@src/features/profiles/presentation/HomePage';
export const Route = createFileRoute('/')({ component: HomePage });
