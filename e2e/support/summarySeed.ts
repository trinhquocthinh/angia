import type { ExtractionPayload } from '@angia/contracts';
import type { SitClient } from './sitFixture.js';

// Lấy ngày Việt Nam ở giữa trưa UTC để phép lùi ngày không vướng biên múi giờ.
export function vietnamDay(daysAgo = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function bloodPressure(daysAgo: number): ExtractionPayload {
  return {
    type: 'device_reading',
    measuredAt: vietnamDay(daysAgo),
    measuredTime: '07:15',
    kind: 'blood_pressure',
    systolic: 120,
    diastolic: 80,
    pulse: 70,
    glucoseValue: null,
    glucoseUnit: null,
  };
}

export async function seedSummary(sit: SitClient, profileId: string, count: number): Promise<void> {
  await sit.record(profileId, {
    type: 'prescription',
    issuedDate: vietnamDay(),
    revisitDate: null,
    facility: 'Cơ sở thử E2E',
    diagnosis: null,
    items: [
      {
        name: 'Thuốc thử E2E',
        strength: '5 mg',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning'],
        durationDays: null,
        longTerm: true,
        note: null,
        totalQuantity: null,
      },
    ],
  });
  await sit.record(profileId, {
    type: 'lab_result',
    resultDate: vietnamDay(),
    facility: 'Cơ sở thử E2E',
    items: [{ testName: 'HbA1c E2E', value: '5.5', unit: '%', referenceRange: null }],
  });
  for (let index = count - 1; index >= 0; index--) {
    await sit.record(profileId, bloodPressure(index));
  }
}
