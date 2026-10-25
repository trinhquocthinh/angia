import { randomUUID } from 'node:crypto';
import { createInvitationTokenCodec } from '@src/features/consentInvitations/infrastructure/createInvitationTokenCodec.js';
import type { InvitationRouteDependencies } from '@src/features/consentInvitations/presentation/registerInvitationRoutes.js';

export function createStubInvitationDeps(): InvitationRouteDependencies {
  return {
    repository: { withFamily: () => Promise.reject(new Error('Kho link chưa cấu hình trong test này')) },
    codec: createInvitationTokenCodec('test-only-invitation-cookie-secret-at-least-32-bytes'),
    now: () => new Date(),
    newId: randomUUID,
    appBaseUrl: 'http://localhost:5173',
  };
}
