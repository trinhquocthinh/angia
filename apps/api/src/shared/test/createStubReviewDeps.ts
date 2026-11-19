import { createStubLegalDeps } from './createStubLegalDeps.js';
import { createStubAccountDeps } from './createStubAccountDeps.js';
import { createStubScanQuotaDeps } from './createStubScanQuotaDeps.js';
import { createStubAiBillingDeps } from './createStubAiBillingDeps.js';
import { createStubAiRoutingDeps } from './createStubAiRoutingDeps.js';
import { TEST_AI_POLICY, TEST_HEAVY_RATE_LIMIT, TEST_QUOTA_POLICY } from './testQuotaPolicy.js';
import type { AppDependencies } from '@src/createApp.js';

const notConfigured = () => Promise.reject(new Error('Kho duyệt/số đo chưa cấu hình trong test này'));

type StubbedDeps = Pick<
  AppDependencies,
  | 'invitationAcceptance'
  | 'householdOwnership'
  | 'householdLeave'
  | 'household'
  | 'householdMembership'
  | 'householdInvitations'
  | 'legal'
  | 'account'
  | 'scanQuota'
  | 'aiBilling'
  | 'aiRouting'
  | 'review'
  | 'measurements'
  | 'labResults'
  | 'documentEntries'
  | 'medications'
  | 'adherence'
  | 'asNeededDoses'
  | 'temperatures'
  | 'doseSlots'
  | 'revisits'
  | 'prescriptionChain'
  | 'timeline'
  | 'selfProfile'
  | 'painJournal'
  | 'reminderRecipients'
  | 'myReminders'
  | 'doseConfirmations'
  | 'myRevisitReminders'
  | 'myConsent'
  | 'visitSummary'
  | 'familyUsage'
  | 'heavyRateLimit'
>;

const householdLeave = {
  repository: { leave: notConfigured },
  storage: { deletePrefix: notConfigured },
  logger: { warn: () => {} },
};

const householdManagement = {
  householdOwnership: { offer: notConfigured, decide: notConfigured, revoke: notConfigured },
  householdLeave,
};

// Sinh OpenAPI hoặc test feature khác: không được gọi hạ tầng duyệt chứng từ và số đo.
export function createStubReviewDeps(): StubbedDeps {
  return {
    ...householdManagement,
    household: { create: notConfigured },
    householdMembership: { change: notConfigured },
    invitationAcceptance: {
      acceptance: { accept: notConfigured },
      founding: { create: notConfigured, revoke: notConfigured },
      appBaseUrl: 'http://localhost:5173',
    },
    householdInvitations: {
      repository: {
        current: notConfigured,
        create: notConfigured,
        revoke: notConfigured,
        list: notConfigured,
        replace: notConfigured,
      },
      appBaseUrl: 'http://localhost:5173',
    },
    legal: createStubLegalDeps(),
    account: createStubAccountDeps(),
    scanQuota: createStubScanQuotaDeps(),
    aiRouting: createStubAiRoutingDeps(),
    aiBilling: createStubAiBillingDeps(),
    review: { repository: { withFamily: notConfigured }, reader: { get: notConfigured } },
    medications: { withFamily: notConfigured },
    adherence: { withFamily: notConfigured },
    asNeededDoses: { withFamily: notConfigured },
    temperatures: { withFamily: notConfigured },
    doseSlots: { withFamily: notConfigured },
    revisits: { withFamily: notConfigured },
    prescriptionChain: { withFamily: notConfigured },
    timeline: { withFamily: notConfigured },
    painJournal: {
      repository: { withFamily: notConfigured },
      forProfile: () => ({ withFamily: notConfigured }),
    },
    selfProfile: {
      forProfile: () => {
        throw new Error('Kho tự xem chưa cấu hình trong test này');
      },
    },
    reminderRecipients: { withFamily: notConfigured },
    myReminders: { load: notConfigured },
    doseConfirmations: { withFamily: notConfigured, withProfileDay: notConfigured },
    myRevisitReminders: { load: notConfigured },
    myConsent: { withFamily: notConfigured },
    visitSummary: { withFamily: notConfigured },
    measurements: { withFamily: notConfigured },
    labResults: { withFamily: notConfigured },
    documentEntries: { withFamily: notConfigured },
    familyUsage: {
      repository: { read: notConfigured, readAiBudget: notConfigured },
      quota: TEST_QUOTA_POLICY,
      ai: TEST_AI_POLICY,
    },
    heavyRateLimit: TEST_HEAVY_RATE_LIMIT,
  };
}
