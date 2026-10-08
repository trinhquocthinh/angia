import type { components } from '@src/shared/api/schema.gen';
import type { PrivacyRepository } from '../../application/privacyPorts';
import { usePrivacyWorkspace } from '../../application/usePrivacyWorkspace';
import { PrivacyEditPanel } from './PrivacyEditPanel';
import { PrivacyReviewPanel } from './PrivacyReviewPanel';
type Props = {
  repository: PrivacyRepository;
  session: components['schemas']['MeContextResponse'];
  documentId: string;
};
export function PrivacyEditor({ repository, session, documentId }: Props) {
  const workspace = usePrivacyWorkspace(repository, session, documentId);
  return (
    <section aria-label="Kiểm tra riêng tư" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <PrivacyEditPanel workspace={workspace} documentId={documentId} />
      <PrivacyReviewPanel workspace={workspace} />
    </section>
  );
}
