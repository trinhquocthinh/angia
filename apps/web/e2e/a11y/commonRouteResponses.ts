import type { components } from '../../src/shared/api/schema.gen.js';
import { currentLegal } from '../accountFixture.js';

type Schemas = components['schemas'];
export const commonRouteResponses: Record<string, unknown> = {
  '/api/legal/current': currentLegal,
  '/api/me/consent': { profile: null },
  '/api/me/push-config': {
    enabled: false,
    publicKey: null,
    registered: false,
  } satisfies Schemas['PushConfig'],
  '/api/health-profiles/linkable-accounts': [],
  '/api/family/invitations/current': { items: [] },
  '/api/me/link-invitations/view': {
    profileName: 'Hồ sơ mẫu',
    inviterName: 'Mẹ',
    expiresAt: '2099-12-01T00:00:00Z',
    canAccept: true,
    reason: null,
    consentNote: null,
  } satisfies Schemas['ProfileLinkView'],
  '/api/family/usage': {
    storage: { usedBytes: 0, limitBytes: 2 * 1024 ** 3 },
    dailyUploads: { used: 0, limit: 100, resetsAt: '2099-12-01T00:00:00Z' },
    pendingJobs: { used: 0, limit: 10 },
    aiOcr: { month: '2026-11', usedPercent: 0, anyUsed: false, exhausted: false },
  } satisfies Schemas['FamilyUsage'],
  '/api/family/scan-quota': {
    month: '2026-11',
    status: 'approved',
    grantedScans: 20,
    usedScans: 0,
    heldScans: 0,
    remainingScans: 20,
    runtimeActive: true,
  } satisfies Schemas['FamilyScanQuota'],
};
