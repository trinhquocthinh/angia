import { registerHouseholdOwnershipRoutes } from '@src/features/household/presentation/registerHouseholdOwnershipRoutes.js';
import { registerHouseholdLeaveRoute } from '@src/features/household/presentation/registerHouseholdLeaveRoute.js';
import { registerInvitationAcceptanceRoutes } from '@src/features/household/presentation/registerInvitationAcceptanceRoutes.js';
import { registerHouseholdInvitationRoutes } from '@src/features/household/presentation/registerHouseholdInvitationRoutes.js';
import { registerHouseholdRoutes } from '@src/features/household/presentation/registerHouseholdRoutes.js';
import { registerHouseholdMembershipRoutes } from '@src/features/household/presentation/registerHouseholdMembershipRoutes.js';
import { registerClinicalRoutes } from './registerClinicalRoutes.js';
import type { AppDependencies } from './createApp.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { registerAccountRoutes } from '@src/features/account/presentation/registerAccountRoutes.js';
import { registerScanQuotaRoutes } from '@src/features/scanQuota/presentation/registerScanQuotaRoutes.js';
import { registerAiBillingRoutes } from '@src/features/aiBilling/presentation/registerAiBillingRoutes.js';
import { registerAiRoutingRoutes } from '@src/features/aiRouting/presentation/registerAiRoutingRoutes.js';
import { registerProfileRoutes } from '@src/features/profiles/presentation/registerProfileRoutes.js';
import { registerAdminRoutes } from '@src/features/family/presentation/registerAdminRoutes.js';
import { registerAiBudgetRoutes } from '@src/features/family/presentation/registerAiBudgetRoutes.js';
import { registerFamilyUsageRoute } from '@src/features/familyQuota/presentation/registerFamilyUsageRoute.js';
import { registerHealthRoute } from '@src/features/health/presentation/registerHealthRoute.js';
import { registerAuthRoutes } from '@src/shared/auth/presentation/registerAuthRoutes.js';
import { registerMeRoute } from '@src/shared/auth/presentation/registerMeRoute.js';
import { registerPushRoutes } from '@src/features/pushSubscriptions/presentation/registerPushRoutes.js';

export function registerAppRoutes(app: OpenAPIHono<AppEnv>, deps: AppDependencies): void {
  const cookies = { secret: deps.auth.cookieSecret, secure: deps.auth.secureCookies };
  registerHouseholdOwnershipRoutes(app, deps.householdOwnership);
  registerHouseholdLeaveRoute(app, deps.householdLeave);
  registerHouseholdRoutes(app, deps.household);
  registerHouseholdMembershipRoutes(app, deps.householdMembership);
  registerInvitationAcceptanceRoutes(app, deps.invitationAcceptance);
  registerHouseholdInvitationRoutes(app, deps.householdInvitations);
  registerHealthRoute(app, deps.healthProbes);
  registerAuthRoutes(app, deps.auth, deps.legal);
  registerAccountRoutes(app, { ...deps.account, cookies, logger: deps.auth.logger });
  registerMeRoute(app, {
    features: {
      redactionSuggestions: Boolean(deps.redactionSuggestions),
      localEnrollmentEnabled: deps.account.enrollmentEnabled,
    },
    lookupLocalCredential: deps.account.lookupLocalCredential,
  });
  if (deps.push) registerPushRoutes(app, deps.push, cookies);
  registerAdminRoutes(app, deps.familyAdmin, deps.scanQuota.now);
  registerScanQuotaRoutes(app, deps.scanQuota);
  registerAiBudgetRoutes(app, deps.aiBudget);
  registerAiRoutingRoutes(app, deps.aiRouting);
  registerAiBillingRoutes(app, deps.aiBilling);
  registerFamilyUsageRoute(app, deps.familyUsage);
  registerProfileRoutes(app, deps);
  registerClinicalRoutes(app, deps);
}
