import type { ExtractionPayload } from '@angia/contracts';
import type { DocumentExtractor } from '../application/ports.js';

// AI_PROVIDER=fake (dev, test thủ công): không gọi mạng, không phát sinh chi phí (Setup gotcha 8.8).
const SAMPLE_PRESCRIPTION: ExtractionPayload = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: 'Phòng khám giả lập',
  diagnosis: 'Tăng huyết áp',
  items: [
    {
      name: 'Amlodipin',
      strength: '5mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: 30,
      longTerm: false,
      note: 'Dữ liệu giả lập từ AI_PROVIDER=fake',
      totalQuantity: 30,
    },
  ],
};

export function createFakeExtractor(): DocumentExtractor {
  return {
    extract: async () => ({
      ok: true,
      content: SAMPLE_PRESCRIPTION,
      provider: 'fake',
      model: 'fake',
      costUsd: 0,
    }),
  };
}
