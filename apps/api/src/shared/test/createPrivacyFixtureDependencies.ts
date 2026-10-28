import type { PrivacyDependencies, PrivacyStore } from '@src/features/documentPrivacy/application/ports.js';
import { hashPrivacyPng } from '@src/features/documentPrivacy/infrastructure/hashPrivacyPng.js';
import type { privacyFixture } from './privacyFixture.js';
type Fixture = ReturnType<typeof privacyFixture>;
const FIXED_NOW = () => new Date('2026-10-08T00:00:00Z');

// Kho giả ghi lại thứ tự gọi (quota, cập nhật) và job đã enqueue để unit test kiểm.
function createFixtureStore(f: Fixture): PrivacyStore {
  return {
    readQuotaUsage: async (_dayStart, lock) => {
      f.calls.push(lock ? 'quota:lock' : 'quota:read');
      return f.usage;
    },
    readAiBudget: async () => f.aiBudget,
    findDocument: async () =>
      f.missing
        ? null
        : { ...structuredClone(f.doc), profileConsentStatus: f.consent ? 'confirmed' : 'withdrawn' },
    consentConfirmed: async () => f.consent,
    updateDocument: async (_id, u) => {
      f.calls.push('update');
      return Object.assign(f.doc, u);
    },
    enqueuePreparation: async () => {
      f.jobs.push('prepare');
    },
    enqueueExtraction: async () => {
      f.jobs.push('extract');
    },
  };
}

export function createPrivacyFixtureDependencies(f: Fixture): PrivacyDependencies {
  const store = createFixtureStore(f);
  return {
    repository: {
      withFamily: async (_id, work) => {
        f.inTx = true;
        try {
          return await work(store);
        } finally {
          f.inTx = false;
        }
      },
    },
    reader: {
      get: async () => {
        if (f.inTx) throw new Error('S3 trong transaction');
        f.onRead();
        return {
          contentType: 'image/png',
          body: new ReadableStream({
            start(c) {
              c.enqueue(f.bytes);
              c.close();
            },
          }),
        };
      },
    },
    queue: { state: async () => f.jobState },
    hashPng: hashPrivacyPng,
    newId: () => f.draftId,
    now: FIXED_NOW,
    ai: {
      estimatedCostUsd: 0.02,
      defaultMonthlyCapUsd: 5,
      defaultFamilyCapUsd: 0.5,
      defaultMonthlyScans: 10,
      now: FIXED_NOW,
    },
    quota: { limits: { storageBytes: 100, dailyUploads: 10, pendingJobs: 3 }, now: FIXED_NOW },
  };
}
