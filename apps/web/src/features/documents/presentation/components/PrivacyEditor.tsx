import { useState } from 'react';
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
  const [inputPending, setInputPending] = useState(false);
  const ready = workspace.state.candidate.state === 'ready';
  return (
    <section aria-label="Kiểm tra riêng tư" className="flex min-w-0 flex-col gap-5">
      <PrivacyEditPanel
        workspace={workspace}
        documentId={documentId}
        inputPending={inputPending}
        onInputPending={setInputPending}
      >
        {!ready && <PrivacyReviewPanel workspace={workspace} inputPending={inputPending} />}
      </PrivacyEditPanel>
      {ready && <PrivacyReviewPanel workspace={workspace} inputPending={inputPending} />}
    </section>
  );
}
