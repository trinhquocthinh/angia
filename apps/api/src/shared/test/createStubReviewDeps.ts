import { createStubPrivacyDeps } from './createStubPrivacyDeps.js';
import { TEST_AI_POLICY, TEST_HEAVY_RATE_LIMIT, TEST_QUOTA_POLICY } from './testQuotaPolicy.js';
import type { AppDependencies } from '@src/createApp.js';

const notConfigured = () => Promise.reject(new Error('Kho duyệt/số đo chưa cấu hình trong test này'));

// Sinh OpenAPI hoặc test feature khác: không được gọi hạ tầng duyệt chứng từ và số đo.
export function createStubReviewDeps(): Pick<
  AppDependencies,
  | 'review'
  | 'measurements'
  | 'labResults'
  | 'documentEntries'
  | 'privacy'
  | 'medications'
  | 'adherence'
  | 'doseSlots'
  | 'reminderRecipients'
  | 'myReminders'
  | 'visitSummary'
  | 'familyUsage'
  | 'familyCaps'
  | 'heavyRateLimit'
> {
  return {
    privacy: createStubPrivacyDeps(),
    review: { repository: { withFamily: notConfigured }, reader: { get: notConfigured } },
    medications: { withFamily: notConfigured },
    adherence: { withFamily: notConfigured },
    doseSlots: { withFamily: notConfigured },
    reminderRecipients: { withFamily: notConfigured },
    myReminders: { load: notConfigured },
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
    familyCaps: {
      repository: { list: notConfigured, inTransaction: notConfigured },
      defaultFamilyCapUsd: 0.5,
      now: () => new Date(),
    },
  };
}
