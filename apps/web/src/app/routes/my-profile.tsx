import { createFileRoute } from '@tanstack/react-router';
import { parseSelfSection, type SelfSectionKey } from '@src/features/selfProfile/application/selfSections';
import { SelfProfilePage } from '@src/features/selfProfile/presentation/SelfProfilePage';

export const Route = createFileRoute('/my-profile')({
  validateSearch: (search: Record<string, unknown>): { section?: SelfSectionKey } => {
    const section = parseSelfSection(search['section']);
    return section ? { section } : {};
  },
  component: function MyProfileRoute() {
    return <SelfProfilePage section={Route.useSearch().section} />;
  },
});
