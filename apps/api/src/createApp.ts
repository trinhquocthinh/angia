import type { HouseholdDeletionRepository } from '@src/features/household/application/deletionPorts.js';
import type { HouseholdOwnershipRepository } from '@src/features/household/application/ownershipPorts.js';
import type { HouseholdLeaveDependencies } from '@src/features/household/application/leavePorts.js';
import type { InvitationAcceptanceDependencies } from '@src/features/household/presentation/registerInvitationAcceptanceRoutes.js';
import type { HouseholdInvitationDependencies } from '@src/features/household/application/invitationPorts.js';
import type { LocalCredentialLookup } from '@src/shared/auth/application/ports.js';
import { registerAppRoutes } from './registerAppRoutes.js';
import type { LegalRepository } from '@src/features/legal/application/ports.js';
import { requireLegalAcceptance } from '@src/features/legal/presentation/requireLegalAcceptance.js';
import { registerLegalRoutes } from '@src/features/legal/presentation/registerLegalRoutes.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import type {
  EnrollLocalCredentialDeps,
  ChangeLocalPasswordDeps,
  LoginLocalAccountDeps,
  RegisterLocalAccountDeps,
} from '@src/features/account/application/ports.js';
import { localCredentialGate } from '@src/features/account/presentation/localCredentialGate.js';
import { registerHealthDataCacheHeaders } from '@src/registerHealthDataCacheHeaders.js';
import type { PainJournalDependencies } from '@src/features/painJournal/presentation/painJournalDependencies.js';
import type { SelfProfileRepository } from '@src/features/selfProfile/application/ports.js';
import type { TimelineRepository } from '@src/features/timeline/application/ports.js';
import type { PrescriptionChainRepository } from '@src/features/prescriptions/application/prescriptionChainPorts.js';
import type { RevisitRepository } from '@src/features/prescriptions/application/revisitPorts.js';
import { registerScanQuotaHeaders } from '@src/features/scanQuota/presentation/registerScanQuotaHeaders.js';
import type { ScanQuotaDependencies } from '@src/features/scanQuota/application/ports.js';
import type { AiBillingDependencies } from '@src/features/aiBilling/application/ports.js';
import type { AiRoutingDependencies } from '@src/features/aiRouting/application/ports.js';
import { HTTPException } from 'hono/http-exception';
import type { AdherenceRepository } from '@src/features/adherence/application/ports.js';
import type { AsNeededDoseRepository } from '@src/features/asNeededDoses/application/ports.js';
import type { TemperatureRepository } from '@src/features/temperatures/application/ports.js';
import type { DoseSlotRepository } from '@src/features/reminders/application/ports.js';
import type { MyConsentRepository } from '@src/features/myConsent/application/ports.js';
import type { MyRevisitReminderRepository } from '@src/features/myRevisitReminders/application/ports.js';
import type { DoseConfirmationRepository } from '@src/features/doseConfirmations/application/ports.js';
import type { MyReminderRepository } from '@src/features/myReminders/application/ports.js';
import type { ReminderRecipientRepository } from '@src/features/reminders/application/recipientPorts.js';
import type { MedicationManagementRepository } from '@src/features/medications/application/managementPorts.js';
import type { ProfileLinkDependencies } from '@src/features/profileLinks/application/ports.js';
import type { DocumentDependencies } from '@src/features/documents/application/ports.js';
import type { RedactionSuggestionDependencies } from '@src/features/documents/application/redactionSuggestionPorts.js';
import { type ReviewDependencies } from '@src/features/documents/presentation/registerReviewRoutes.js';
import type { LabResultRepository } from '@src/features/labResults/application/ports.js';
import type { DocumentEntryRepository } from '@src/features/documents/application/documentEntryPorts.js';
import type { MeasurementRepository } from '@src/features/measurements/application/ports.js';
import type { VisitSummaryRepository } from '@src/features/visitSummary/application/ports.js';
import type { ProfileDependencies } from '@src/features/profiles/application/ports.js';
import { OpenAPIHono } from '@hono/zod-openapi';
import { except } from 'hono/combine';
import type { FamilyAdminRepository } from '@src/features/family/application/ports.js';
import type { AiBudgetDependencies } from '@src/features/family/application/aiBudgetPorts.js';
import type { FamilyUsageDependencies } from '@src/features/familyQuota/application/ports.js';
import type { HealthProbes } from '@src/features/health/application/ports.js';
import { loadSession } from '@src/shared/auth/presentation/loadSession.js';
import { type AuthRouteDeps } from '@src/shared/auth/presentation/registerAuthRoutes.js';
import { requirePasswordChanged } from '@src/shared/auth/presentation/requirePasswordChanged.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { limitRequestBody } from '@src/shared/http/limitRequestBody.js';
import type { PushDependencies } from '@src/features/pushSubscriptions/application/ports.js';

import type { HouseholdRepository } from '@src/features/household/application/ports.js';
import type { HouseholdMembershipRepository } from '@src/features/household/application/membershipPorts.js';

import type { ProfileGuardianRepository } from '@src/features/profiles/guardians/application/ports.js';

export type AppDependencies = {
  profileGuardians: ProfileGuardianRepository;
  householdDeletion: HouseholdDeletionRepository;
  householdOwnership: HouseholdOwnershipRepository;
  householdLeave: HouseholdLeaveDependencies;
  household: HouseholdRepository;
  householdMembership: HouseholdMembershipRepository;
  invitationAcceptance: InvitationAcceptanceDependencies;
  householdInvitations: HouseholdInvitationDependencies;
  legal: LegalRepository;
  push?: PushDependencies;
  // SPEC-083: chỉ có khi cấu hình OCR_MASK_URL; vắng thì tắt gợi ý vùng che.
  redactionSuggestions?: RedactionSuggestionDependencies;
  healthProbes: HealthProbes;
  auth: AuthRouteDeps;
  account: RegisterLocalAccountDeps &
    LoginLocalAccountDeps &
    ChangeLocalPasswordDeps &
    EnrollLocalCredentialDeps & {
      lookupLocalCredential: LocalCredentialLookup;
      appBaseUrl: string;
      rateLimit: RateLimitDependencies;
      clientIp: ClientIpResolver;
    };
  familyAdmin: FamilyAdminRepository;
  aiBudget: AiBudgetDependencies;
  aiRouting: AiRoutingDependencies;
  aiBilling: AiBillingDependencies;
  scanQuota: ScanQuotaDependencies;
  profiles: ProfileDependencies;
  profileLinks: ProfileLinkDependencies;
  documents: DocumentDependencies;
  review: ReviewDependencies;
  measurements: MeasurementRepository;
  labResults: LabResultRepository;
  documentEntries: DocumentEntryRepository;
  medications: MedicationManagementRepository;
  adherence: AdherenceRepository;
  asNeededDoses: AsNeededDoseRepository;
  temperatures: TemperatureRepository;
  doseSlots: DoseSlotRepository;
  revisits: RevisitRepository;
  prescriptionChain: PrescriptionChainRepository;
  timeline: TimelineRepository;
  selfProfile: SelfProfileRepository;
  painJournal: PainJournalDependencies;
  reminderRecipients: ReminderRecipientRepository;
  myReminders: MyReminderRepository;
  doseConfirmations: DoseConfirmationRepository;
  myRevisitReminders: MyRevisitReminderRepository;
  myConsent: MyConsentRepository;
  visitSummary: VisitSummaryRepository;
  familyUsage: FamilyUsageDependencies;
  // F03b: nhịp thao tác nặng mỗi tài khoản/thao tác trong 60 s (đếm trong tiến trình).
  heavyRateLimit: { perMinute: number; now(): number };
};

// Ngoại lệ duy nhất của "mọi route /api cần phiên" (Tech Spec §4); logout vẫn cần phiên + CSRF.
const PUBLIC_PATHS = [
  '/api/legal/current',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/password-login',
  '/api/auth/callback',
  '/api/consent-invitations/view',
  '/api/consent-invitations/respond',
];

// Lắp ráp route từ các adapter đã khởi tạo; tách khỏi server.ts để test in-process qua app.request().
export function createApp(deps: AppDependencies): OpenAPIHono<AppEnv> {
  // Body/params sai Zod schema → 422 ERR_VALIDATION theo cấu trúc lỗi chuẩn (SDD §4.2).
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => (result.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  const cookies = { secret: deps.auth.cookieSecret, secure: deps.auth.secureCookies };
  app.onError((error, c) => {
    // Body JSON rỗng/hỏng do validator ném HTTPException 400: cùng nhóm 422 như dữ liệu sai định dạng.
    if (error instanceof HTTPException && error.status === 400) return errorResponse(c, 'ERR_VALIDATION');
    deps.auth.logger.error({ reason: error.name }, 'Lỗi chưa xử lý');
    return errorResponse(c, 'ERR_INTERNAL');
  });
  app.use('/api/me/local-credential', localCredentialGate(deps.account.enrollmentEnabled));
  registerHealthDataCacheHeaders(app);
  registerScanQuotaHeaders(app);
  app.use(
    '/api/*',
    except(
      ['/api/consent-invitations/view', '/api/consent-invitations/respond'],
      loadSession(deps.auth.login, cookies),
    ),
  );
  app.use('/api/*', except(PUBLIC_PATHS, requireSession()));
  app.use('/api/*', except(PUBLIC_PATHS, requirePasswordChanged()), limitRequestBody());
  app.use('/api/*', except(PUBLIC_PATHS, requireLegalAcceptance(deps.legal, deps.auth.logger)));
  registerLegalRoutes(app, deps.legal);
  registerAppRoutes(app, deps);
  return app;
}
