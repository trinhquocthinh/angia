import type { RegisterLocalAccountDeps } from '@src/features/account/application/ports.js';
import { createStubAuthDeps } from './createStubAuthDeps.js';

const notConfigured = () => Promise.reject(new Error('Đăng ký chưa cấu hình trong ngữ cảnh này'));

export function createStubAccountDeps(): RegisterLocalAccountDeps & { appBaseUrl: string } {
  const { login } = createStubAuthDeps();
  return {
    appBaseUrl: 'https://angia.test',
    gate: { isOpen: notConfigured },
    legalVersions: { current: notConfigured },
    invitationVerifier: { verify: notConfigured },
    hasher: { hash: notConfigured, verify: notConfigured, needsRehash: () => false },
    accounts: { isUsernameTaken: notConfigured, register: notConfigured },
    sessions: login.sessions,
    generateToken: login.generateToken,
    now: login.now,
  };
}
