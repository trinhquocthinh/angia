import { randomUUID } from 'node:crypto';
import { createProfileLinkTokenCodec } from '@src/features/profileLinks/infrastructure/createProfileLinkTokenCodec.js';
import type { ProfileLinkDependencies } from '@src/features/profileLinks/application/ports.js';

export function createStubProfileLinkDeps(): ProfileLinkDependencies {
  return {
    repository: { withFamily: () => Promise.reject(new Error('Kho link chưa cấu hình trong test này')) },
    codec: createProfileLinkTokenCodec('test-only-invitation-cookie-secret-at-least-32-bytes'),
    now: () => new Date(),
    newId: randomUUID,
    appBaseUrl: 'http://localhost:5173',
  };
}
