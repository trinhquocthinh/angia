import type { AppDependencies } from './createApp.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { registerPainJournalRoutes } from '@src/features/painJournal/presentation/painJournalRoutes.js';
import { registerHistoryRoutes } from '@src/registerHistoryRoutes.js';
import { registerAdherenceRoutes } from '@src/features/adherence/presentation/registerAdherenceRoutes.js';
import { registerDoseSlotRoutes } from '@src/features/reminders/presentation/registerDoseSlotRoutes.js';
import { registerMyConsentRoutes } from '@src/features/myConsent/presentation/registerMyConsentRoutes.js';
import { registerMyRevisitReminderRoutes } from '@src/features/myRevisitReminders/presentation/registerMyRevisitReminderRoutes.js';
import { registerMyReminderRoutes } from '@src/features/myReminders/presentation/registerMyReminderRoutes.js';
import { registerReminderRecipientRoutes } from '@src/features/reminders/presentation/registerReminderRecipientRoutes.js';
import { registerMedicationRoutes } from '@src/features/medications/presentation/registerMedicationRoutes.js';
import { registerProfileLinkRoutes } from '@src/features/profileLinks/presentation/registerProfileLinkRoutes.js';
import { registerDocumentRoutes } from '@src/features/documents/presentation/registerDocumentRoutes.js';
import { registerRedactionSuggestionRoutes } from '@src/features/documents/presentation/registerRedactionSuggestionRoutes.js';
import { registerDeletionRoutes } from '@src/features/documents/presentation/registerDeletionRoutes.js';
import { registerManualRecordRoutes } from '@src/features/documents/presentation/registerManualRecordRoutes.js';
import { registerReviewRoutes } from '@src/features/documents/presentation/registerReviewRoutes.js';
import { registerDocumentEntryRoutes } from '@src/features/documents/presentation/registerDocumentEntryRoutes.js';
import { registerLabResultRoutes } from '@src/features/labResults/presentation/registerLabResultRoutes.js';
import { registerMeasurementRoutes } from '@src/features/measurements/presentation/registerMeasurementRoutes.js';
import { registerVisitSummaryRoute } from '@src/features/visitSummary/presentation/registerVisitSummaryRoute.js';
import { createSlidingWindowLimiter } from '@src/shared/http/createSlidingWindowLimiter.js';
export function registerClinicalRoutes(app: OpenAPIHono<AppEnv>, deps: AppDependencies): void {
  // Một limiter dùng chung cho mọi thao tác nặng; khóa tách theo tài khoản + thao tác.
  const heavyLimiter = createSlidingWindowLimiter({
    limit: deps.heavyRateLimit.perMinute,
    windowMs: 60_000,
    now: deps.heavyRateLimit.now,
  });
  registerDocumentRoutes(app, deps.documents, heavyLimiter);
  registerRedactionSuggestionRoutes(app, deps.documents.repository, deps.redactionSuggestions, heavyLimiter);
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
  registerMyReminderRoutes(app, deps.myReminders, deps.auth.login.now);
  registerMyRevisitReminderRoutes(app, deps.myRevisitReminders);
  registerMyConsentRoutes(app, deps.myConsent, deps.auth.login.now);
  registerVisitSummaryRoute(app, deps.visitSummary, deps.auth.login.now);
  registerProfileLinkRoutes(app, deps.profileLinks);
  registerPainJournalRoutes(app, { ...deps.painJournal, now: deps.auth.login.now });
}
