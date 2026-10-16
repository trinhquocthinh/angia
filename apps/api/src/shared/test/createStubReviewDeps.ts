import { createStubPrivacyDeps } from './createStubPrivacyDeps.js';
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
  | 'visitSummary'
> {
  return {
    privacy: createStubPrivacyDeps(),
    review: { repository: { withFamily: notConfigured }, reader: { get: notConfigured } },
    medications: { withFamily: notConfigured },
    adherence: { withFamily: notConfigured },
    visitSummary: { withFamily: notConfigured },
    measurements: { withFamily: notConfigured },
    labResults: { withFamily: notConfigured },
    documentEntries: { withFamily: notConfigured },
  };
}
