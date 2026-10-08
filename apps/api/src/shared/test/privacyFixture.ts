import { createHash } from 'node:crypto';
import { createPrivacyTestDocument } from './createPrivacyTestDocument.js';
import type { PrivacyDependencies } from '@src/features/documentPrivacy/application/ports.js';
import { createPrivacyFixtureDependencies } from './createPrivacyFixtureDependencies.js';
// Adapter thuần bộ nhớ cho unit test; integration dùng PostgreSQL/pg-boss thật.
export function privacyFixture() {
  const draftId = '22222222-2222-4222-8222-222222222222';
  const doc = createPrivacyTestDocument();
  const f = {
    doc,
    draftId,
    bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]),
    consent: true,
    missing: false,
    jobState: 'active' as string | null,
    jobs: [] as string[],
    inTx: false,
    onRead: () => {},
    target: { familyId: 'family', documentId: 'doc' },
    approval: {
      familyId: 'family',
      documentId: 'doc',
      accountId: 'actor',
      draftId,
      sha256: '',
      confirmed: true as const,
    },
    deps: null as unknown as PrivacyDependencies,
    ready: () => {},
  };
  f.deps = createPrivacyFixtureDependencies(f);
  f.ready = () => {
    doc.privacyDraftId = draftId;
    doc.privacyDraftStatus = 'ready';
    doc.ocrImageKey = `families/family/profiles/profile/documents/doc/ocr/${draftId}/33333333-3333-4333-8333-333333333333.png`;
    doc.ocrImageSha256 = createHash('sha256').update(f.bytes).digest('hex');
    f.approval.sha256 = doc.ocrImageSha256;
  };
  return f;
}
