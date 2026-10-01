import { createFileRoute } from '@tanstack/react-router';
import { WelcomePage } from '@src/features/welcome/presentation/WelcomePage';

export const Route = createFileRoute('/')({
  component: WelcomePage,
});
