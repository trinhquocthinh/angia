import { createFileRoute } from '@tanstack/react-router';
import { WelcomePage } from '@src/features/welcome/presentation/WelcomePage';

export const Route = createFileRoute('/')({
  component: () => (
    <div className="mx-auto max-w-md px-4 py-8">
      <WelcomePage />
    </div>
  ),
});
