import type { components } from '../../src/shared/api/schema.gen.js';
import { routeIds } from './routes.js';

// Mẫu tối thiểu hợp lệ cho trang chi tiết; không mô phỏng chuỗi đơn phức tạp.
export const prescriptionResponse = {
  prescription: {
    id: routeIds.prescriptionId,
    healthProfileId: routeIds.profileId,
    sourceDocumentId: null,
    issuedDate: '2026-11-20',
    revisitDate: null,
    facility: 'Cơ sở khám mẫu',
    diagnosis: null,
    manualWithoutSource: true,
    createdAt: '2026-11-20T00:00:00Z',
    items: [
      {
        id: routeIds.prescriptionId,
        name: 'Thuốc mẫu',
        strength: null,
        quantityPerDose: 1,
        externalUse: false,
        doseUnit: 'viên',
        slots: ['morning'],
        durationDays: null,
        longTerm: true,
        note: null,
        totalQuantity: null,
        minIntervalText: null,
      },
    ],
  },
  previousId: null,
  nextId: null,
  courses: [],
  diff: { added: [], removed: [], changed: [] },
} satisfies components['schemas']['PrescriptionDetail'];
