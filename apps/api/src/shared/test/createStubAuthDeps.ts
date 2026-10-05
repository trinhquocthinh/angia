import type { AuthRouteDeps } from '@src/shared/auth/presentation/registerAuthRoutes.js';
import { createSilentLogger } from './createSilentLogger.js';

const notConfigured = () => Promise.reject(new Error('OIDC không cấu hình trong ngữ cảnh này'));

// Cho test/script chỉ cần cấu trúc route (health, sinh OpenAPI): mọi lời gọi OIDC/DB đều từ chối.
export function createStubAuthDeps(): AuthRouteDeps {
  return {
    login: {
      oidc: { createAuthorizationRequest: notConfigured, exchangeCode: notConfigured },
      accounts: { upsertFromIdentity: notConfigured },
      sessions: { create: notConfigured },
      adminGroupName: 'angia-admins',
      generateToken: () => 'stub',
      now: () => new Date(),
    },
    cookieSecret: 'stub-secret-stub-secret-stub-secret',
    secureCookies: false,
    logger: createSilentLogger(),
  };
}
