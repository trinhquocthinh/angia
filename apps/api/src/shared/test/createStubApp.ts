import { createStubAccountDeps } from './createStubAccountDeps.js';
import { createStubAiBudgetDeps } from '@src/shared/test/createStubAiBudgetDeps.js';
import { createApp } from '@src/createApp.js';
import { createFakeFamilyAdminRepository } from './createFakeFamilyAdminRepository.js';
import { createStubAuthDeps } from './createStubAuthDeps.js';
import { createStubDocumentDeps } from './createStubDocumentDeps.js';
import { createStubProfileLinkDeps } from './createStubProfileLinkDeps.js';
import { createStubProfileDeps } from './createStubProfileDeps.js';
import { createStubReviewDeps } from './createStubReviewDeps.js';

import { createStubPushDeps } from './createStubPushDeps.js';

const noopProbe = () => Promise.resolve();

// App đủ mọi route nhưng hạ tầng giả: chỉ dùng để đọc cấu trúc route (OpenAPI, kiểm kê NFR-4).
export function createStubApp() {
  return createApp({
    adminAudit: { repository: { list: async () => [] } },
    adminStats: { repository: { weekly: async () => [] } },
    accountLock: { repository: { get: async () => null, lock: async () => null, unlock: async () => null } },
    registrationSwitch: {
      repository: { setOpen: async () => undefined },
      gate: { isOpen: async () => true },
    },
    accountDeletion: {
      passwords: createStubAccountDeps().passwords,
      hasher: createStubAccountDeps().hasher,
      rateLimit: createStubAccountDeps().rateLimit,
      store: { deleteAccount: async () => ({ ok: false, code: 'ERR_INVALID_CREDENTIALS' }) },
      hashUsername: () => 'stub',
      storage: { deletePrefix: async () => 0 },
      logger: { warn: () => undefined },
    },
    dataExport: {
      repository: { withRequest: async () => ({ ok: false, code: 'ERR_NOT_FOUND' }), find: async () => null },
      reader: { get: async () => null },
      now: () => new Date(),
    },
    push: createStubPushDeps(),
    profileLinks: createStubProfileLinkDeps(),
    documents: createStubDocumentDeps(),
    ...createStubReviewDeps(),
    healthProbes: { db: noopProbe, storage: noopProbe },
    auth: createStubAuthDeps(),
    profiles: createStubProfileDeps(),
    familyAdmin: createFakeFamilyAdminRepository().repository,
    aiBudget: createStubAiBudgetDeps(),
  });
}
