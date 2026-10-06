import { createStubInvitationDeps } from '../src/shared/test/createStubInvitationDeps.js';
import { createStubProfileRepository } from '../src/shared/test/createStubProfileRepository.js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/createApp.js';
import { createStubAuthDeps } from '../src/shared/test/createStubAuthDeps.js';
import { createFakeFamilyAdminRepository } from '../src/shared/test/createFakeFamilyAdminRepository.js';

// Sinh OpenAPI từ route Zod; probe/auth/repository giả vì chỉ cần cấu trúc route, không gọi hạ tầng.
const noopProbe = () => Promise.resolve();
const app = createApp({
  consentInvitations: createStubInvitationDeps(),
  healthProbes: { db: noopProbe, storage: noopProbe },
  auth: createStubAuthDeps(),
  profiles: createStubProfileRepository(),
  familyAdmin: createFakeFamilyAdminRepository().repository,
});

const document = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'An Gia API', version: '0.1.0' },
});

const outputPath = fileURLToPath(new URL('../../../packages/contracts/openapi.json', import.meta.url));
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Đã ghi OpenAPI vào ${outputPath}`);
