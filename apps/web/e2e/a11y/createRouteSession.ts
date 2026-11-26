import type { components } from '../../src/shared/api/schema.gen.js';
import { todayState } from '../todayState.js';
import type { RouteAccess } from './routes.js';

export function createRouteSession(access: RouteAccess): components['schemas']['MeContextResponse'] {
  const { session } = todayState(access === 'member' ? 'member' : 'main');
  const enrollment = access === 'enrollment';
  return {
    ...session,
    account: { ...session.account, isSystemAdmin: access === 'admin' },
    family: access === 'noFamily' ? null : session.family,
    role: access === 'noFamily' ? null : session.role,
    authMethod: enrollment ? 'oidc' : 'local',
    hasLocalCredential: !enrollment,
    emailStatus: { email: null, emailVerified: false, pendingEmail: null },
    features: { redactionSuggestions: false, localEnrollmentEnabled: enrollment },
  };
}
