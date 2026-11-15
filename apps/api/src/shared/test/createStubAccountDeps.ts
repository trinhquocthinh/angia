import type { AppDependencies } from '@src/createApp.js';
import { createStubAuthDeps } from './createStubAuthDeps.js';

const notConfigured = () => Promise.reject(new Error('Đăng ký chưa cấu hình trong ngữ cảnh này'));

export function createStubAccountDeps(): AppDependencies['account'] {
  const { login } = createStubAuthDeps();
  return {
    rateLimit: {
      store: { increment: async () => 1, read: async () => 0 },
      keyHasher: () => 'stub',
      now: () => 0,
    },
    clientIp: () => 'stub',
    appBaseUrl: 'https://angia.test',
    gate: { isOpen: notConfigured },
    legalVersions: { current: notConfigured },
    invitationVerifier: { verify: notConfigured },
    hasher: { hash: notConfigured, verify: notConfigured, needsRehash: () => false },
    accounts: { isUsernameTaken: notConfigured, register: notConfigured },
    identity: { verifyPassword: notConfigured },
    enrollmentEnabled: false,
    lookupLocalCredential: async () => ({ hasLocalCredential: false }),
    enrollments: { findAccount: notConfigured, insertIfAbsent: notConfigured },
    passwords: { findCredential: notConfigured, replaceIfCurrent: notConfigured },
    localLoginSessions: { createIfCurrent: notConfigured },
    sessions: login.sessions,
    generateToken: login.generateToken,
    now: login.now,
  };
}
