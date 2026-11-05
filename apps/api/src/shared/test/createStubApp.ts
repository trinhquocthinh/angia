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
