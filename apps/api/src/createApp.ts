import type { TimelineRepository } from '@src/features/timeline/application/ports.js';
import { registerHistoryRoutes } from '@src/registerHistoryRoutes.js';
import type { PrescriptionChainRepository } from '@src/features/prescriptions/application/prescriptionChainPorts.js';
import type { RevisitRepository } from '@src/features/prescriptions/application/revisitPorts.js';
import { registerScanQuotaHeaders } from '@src/features/scanQuota/presentation/registerScanQuotaHeaders.js';
import type { ScanQuotaDependencies } from '@src/features/scanQuota/application/ports.js';
import { registerScanQuotaRoutes } from '@src/features/scanQuota/presentation/registerScanQuotaRoutes.js';
import type { AiBillingDependencies } from '@src/features/aiBilling/application/ports.js';
import { registerAiBillingRoutes } from '@src/features/aiBilling/presentation/registerAiBillingRoutes.js';
import type { AiRoutingDependencies } from '@src/features/aiRouting/application/ports.js';
import { registerAiRoutingRoutes } from '@src/features/aiRouting/presentation/registerAiRoutingRoutes.js';
import { HTTPException } from 'hono/http-exception';
import type { AdherenceRepository } from '@src/features/adherence/application/ports.js';
import { registerAdherenceRoutes } from '@src/features/adherence/presentation/registerAdherenceRoutes.js';
import type { DoseSlotRepository } from '@src/features/reminders/application/ports.js';
import { registerDoseSlotRoutes } from '@src/features/reminders/presentation/registerDoseSlotRoutes.js';
import type { MyConsentRepository } from '@src/features/myConsent/application/ports.js';
import { registerMyConsentRoutes } from '@src/features/myConsent/presentation/registerMyConsentRoutes.js';
import type { MyRevisitReminderRepository } from '@src/features/myRevisitReminders/application/ports.js';
import { registerMyRevisitReminderRoutes } from '@src/features/myRevisitReminders/presentation/registerMyRevisitReminderRoutes.js';
import type { MyReminderRepository } from '@src/features/myReminders/application/ports.js';
import { registerMyReminderRoutes } from '@src/features/myReminders/presentation/registerMyReminderRoutes.js';
import type { ReminderRecipientRepository } from '@src/features/reminders/application/recipientPorts.js';
import { registerReminderRecipientRoutes } from '@src/features/reminders/presentation/registerReminderRecipientRoutes.js';
import type { MedicationManagementRepository } from '@src/features/medications/application/managementPorts.js';
import { registerMedicationRoutes } from '@src/features/medications/presentation/registerMedicationRoutes.js';
import {
  registerInvitationRoutes,
  type InvitationRouteDependencies,
} from '@src/features/consentInvitations/presentation/registerInvitationRoutes.js';
import type { DocumentDependencies } from '@src/features/documents/application/ports.js';
import { registerDocumentRoutes } from '@src/features/documents/presentation/registerDocumentRoutes.js';
import { registerDeletionRoutes } from '@src/features/documents/presentation/registerDeletionRoutes.js';
import { registerManualRecordRoutes } from '@src/features/documents/presentation/registerManualRecordRoutes.js';
import {
  registerReviewRoutes,
  type ReviewDependencies,
} from '@src/features/documents/presentation/registerReviewRoutes.js';
import type { LabResultRepository } from '@src/features/labResults/application/ports.js';
import type { DocumentEntryRepository } from '@src/features/documents/application/documentEntryPorts.js';
import { registerDocumentEntryRoutes } from '@src/features/documents/presentation/registerDocumentEntryRoutes.js';
import { registerLabResultRoutes } from '@src/features/labResults/presentation/registerLabResultRoutes.js';
import type { MeasurementRepository } from '@src/features/measurements/application/ports.js';
import { registerMeasurementRoutes } from '@src/features/measurements/presentation/registerMeasurementRoutes.js';
import type { VisitSummaryRepository } from '@src/features/visitSummary/application/ports.js';
import { registerVisitSummaryRoute } from '@src/features/visitSummary/presentation/registerVisitSummaryRoute.js';
import type { ProfileDependencies } from '@src/features/profiles/application/ports.js';
import { registerProfileRoutes } from '@src/features/profiles/presentation/registerProfileRoutes.js';
import { OpenAPIHono } from '@hono/zod-openapi';
import { except } from 'hono/combine';
import type { FamilyAdminRepository } from '@src/features/family/application/ports.js';
import { registerAdminRoutes } from '@src/features/family/presentation/registerAdminRoutes.js';
import type { AiBudgetDependencies } from '@src/features/family/application/aiBudgetPorts.js';
import { registerAiBudgetRoutes } from '@src/features/family/presentation/registerAiBudgetRoutes.js';
import type { FamilyUsageDependencies } from '@src/features/familyQuota/application/ports.js';
import { registerFamilyUsageRoute } from '@src/features/familyQuota/presentation/registerFamilyUsageRoute.js';
import type { HealthProbes } from '@src/features/health/application/ports.js';
import { registerHealthRoute } from '@src/features/health/presentation/registerHealthRoute.js';
import { loadSession } from '@src/shared/auth/presentation/loadSession.js';
import { type AuthRouteDeps, registerAuthRoutes } from '@src/shared/auth/presentation/registerAuthRoutes.js';
import { registerMeRoute } from '@src/shared/auth/presentation/registerMeRoute.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createSlidingWindowLimiter } from '@src/shared/http/createSlidingWindowLimiter.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

import type { PushDependencies } from '@src/features/pushSubscriptions/application/ports.js';
import { registerPushRoutes } from '@src/features/pushSubscriptions/presentation/registerPushRoutes.js';

export type AppDependencies = {
  push?: PushDependencies;
  healthProbes: HealthProbes;
  auth: AuthRouteDeps;
  familyAdmin: FamilyAdminRepository;
  aiBudget: AiBudgetDependencies;
  aiRouting: AiRoutingDependencies;
  aiBilling: AiBillingDependencies;
  scanQuota: ScanQuotaDependencies;
  profiles: ProfileDependencies;
  consentInvitations: InvitationRouteDependencies;
  documents: DocumentDependencies;
  review: ReviewDependencies;
  measurements: MeasurementRepository;
  labResults: LabResultRepository;
  documentEntries: DocumentEntryRepository;
  medications: MedicationManagementRepository;
  adherence: AdherenceRepository;
  doseSlots: DoseSlotRepository;
  revisits: RevisitRepository;
  prescriptionChain: PrescriptionChainRepository;
  timeline: TimelineRepository;
  reminderRecipients: ReminderRecipientRepository;
  myReminders: MyReminderRepository;
  myRevisitReminders: MyRevisitReminderRepository;
  myConsent: MyConsentRepository;
  visitSummary: VisitSummaryRepository;
  familyUsage: FamilyUsageDependencies;
  // F03b: nhịp thao tác nặng mỗi tài khoản/thao tác trong 60 s (đếm trong tiến trình).
  heavyRateLimit: { perMinute: number; now(): number };
};

// Ngoại lệ duy nhất của "mọi route /api cần phiên" (Tech Spec §4); logout vẫn cần phiên + CSRF.
const PUBLIC_PATHS = [
  '/api/health',
  '/api/auth/login',
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
  app.use('/api/source-documents/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Content-Type-Options', 'nosniff');
    await next();
  });
  registerScanQuotaHeaders(app);
  app.use(
    '/api/*',
    except(
      ['/api/consent-invitations/view', '/api/consent-invitations/respond'],
      loadSession(deps.auth.login, cookies),
    ),
  );
  app.use('/api/*', except(PUBLIC_PATHS, requireSession()));
  registerHealthRoute(app, deps.healthProbes);
  registerAuthRoutes(app, deps.auth);
  registerMeRoute(app);
  if (deps.push)
    registerPushRoutes(app, deps.push, { secret: deps.auth.cookieSecret, secure: deps.auth.secureCookies });
  registerAdminRoutes(app, deps.familyAdmin, deps.scanQuota.now);
  registerScanQuotaRoutes(app, deps.scanQuota);
  registerAiBudgetRoutes(app, deps.aiBudget);
  registerAiRoutingRoutes(app, deps.aiRouting);
  registerAiBillingRoutes(app, deps.aiBilling);
  registerFamilyUsageRoute(app, deps.familyUsage);
  registerProfileRoutes(app, { ...deps.profiles, logger: deps.auth.logger }, deps.auth.login.now);
  // Một limiter dùng chung cho mọi thao tác nặng; khóa tách theo tài khoản + thao tác.
  const heavyLimiter = createSlidingWindowLimiter({
    limit: deps.heavyRateLimit.perMinute,
    windowMs: 60_000,
    now: deps.heavyRateLimit.now,
  });
  registerDocumentRoutes(app, deps.documents, heavyLimiter);
  registerReviewRoutes(app, deps.review);
  registerDeletionRoutes(app, deps.documents, deps.auth.logger);
  registerManualRecordRoutes(app, deps.review.repository);
  registerMeasurementRoutes(app, deps.measurements);
  registerLabResultRoutes(app, deps.labResults);
  registerDocumentEntryRoutes(app, deps.documentEntries);
  registerMedicationRoutes(app, deps.medications, deps.auth.login.now);
  registerAdherenceRoutes(app, deps.adherence, deps.auth.login.now);
  registerDoseSlotRoutes(app, deps.doseSlots);
  registerHistoryRoutes(app, deps, deps.auth.login.now);
  registerReminderRecipientRoutes(app, deps.reminderRecipients);
  registerMyReminderRoutes(app, deps.myReminders);
  registerMyRevisitReminderRoutes(app, deps.myRevisitReminders);
  registerMyConsentRoutes(app, deps.myConsent, deps.auth.login.now);
  registerVisitSummaryRoute(app, deps.visitSummary, deps.auth.login.now);
  registerInvitationRoutes(app, deps.consentInvitations);
  return app;
}
