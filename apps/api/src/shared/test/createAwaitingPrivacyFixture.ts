import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from './acceptConsentInvitation.js';
import { seedPendingDocument } from './seedPendingDocument.js';
import type { ProfileTestApp } from './startProfileTestApp.js';
export async function createAwaitingPrivacyFixture(t: ProfileTestApp) {
  const familyId = await t.family(),
    main = await t.session(familyId);
  const profile = (await (
    await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Ba' })
  ).json()) as HealthProfile;
  await acceptConsentInvitation(t, main, profile.id);
  const { documentId } = await seedPendingDocument(
    t,
    { familyId, profileId: profile.id, accountId: main.accountId },
    {},
  );
  await t.owner.query("UPDATE source_documents SET status='awaiting_privacy' WHERE id=$1", [documentId]);
  return { familyId, main, profile, documentId, path: `/api/source-documents/${documentId}` };
}
