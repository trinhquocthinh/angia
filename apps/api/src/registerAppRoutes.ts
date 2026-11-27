import { registerAdminAuditRoutes } from '@src/features/adminAudit/presentation/registerAdminAuditRoutes.js';
import { registerAdminStatsRoutes } from '@src/features/adminStats/presentation/registerAdminStatsRoutes.js';
import { registerAccountLockRoutes } from '@src/features/accountLock/presentation/registerAccountLockRoutes.js';
import { registerInspectHouseholdInvitationRoute } from '@src/features/household/presentation/registerInspectHouseholdInvitationRoute.js';
import { registerRegistrationSwitchRoutes } from '@src/features/registrationSwitch/presentation/registerRegistrationSwitchRoutes.js';
import { registerAccountDeletionRoute } from '@src/features/account/presentation/registerAccountDeletionRoute.js';
import { registerDataExportRoutes } from '@src/features/dataExport/presentation/registerDataExportRoutes.js';
import { registerProfileGuardianRoutes } from '@src/features/profiles/guardians/presentation/registerProfileGuardianRoutes.js';
import { registerHouseholdDeletionRoutes } from '@src/features/household/presentation/registerHouseholdDeletionRoutes.js';
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
  if (deps.adminAudit) registerAdminAuditRoutes(app, deps.adminAudit);
  if (deps.adminStats) registerAdminStatsRoutes(app, deps.adminStats);
  if (deps.accountLock) registerAccountLockRoutes(app, deps.accountLock);
  if (deps.registrationSwitch) registerRegistrationSwitchRoutes(app, deps.registrationSwitch);
  if (deps.dataExport) registerDataExportRoutes(app, deps.dataExport);
  const cookies = { secret: deps.auth.cookieSecret, secure: deps.auth.secureCookies };
  if (deps.accountDeletion)
    registerAccountDeletionRoute(app, {
      ...deps.accountDeletion,
      cookies,
      clientIp: deps.account.clientIp,
      appBaseUrl: deps.account.appBaseUrl,
    });
  registerHouseholdDeletionRoutes(app, deps.householdDeletion);
  registerHouseholdOwnershipRoutes(app, deps.householdOwnership);
  registerHouseholdLeaveRoute(app, deps.householdLeave);
  registerHouseholdRoutes(app, deps.household);
  registerHouseholdMembershipRoutes(app, deps.householdMembership);
  registerInvitationAcceptanceRoutes(app, deps.invitationAcceptance);
  registerInspectHouseholdInvitationRoute(app, {
    repository: deps.invitationAcceptance.inspection,
    appBaseUrl: deps.invitationAcceptance.appBaseUrl,
    rateLimit: deps.account.rateLimit,
    clientIp: deps.account.clientIp,
  });
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
  registerProfileGuardianRoutes(app, deps.profileGuardians);
  registerClinicalRoutes(app, deps);
}
