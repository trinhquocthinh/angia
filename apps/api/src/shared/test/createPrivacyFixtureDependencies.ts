import type { PrivacyDependencies, PrivacyStore } from '@src/features/documentPrivacy/application/ports.js';
import { hashPrivacyPng } from '@src/features/documentPrivacy/infrastructure/hashPrivacyPng.js';
import type { privacyFixture } from './privacyFixture.js';
export function createPrivacyFixtureDependencies(f: ReturnType<typeof privacyFixture>): PrivacyDependencies {
  const store: PrivacyStore = {
    readQuotaUsage: async (_dayStart, lock) => {
      f.calls.push(lock ? 'quota:lock' : 'quota:read');
      return f.usage;
    },
    findDocument: async () => (f.missing ? null : structuredClone(f.doc)),
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
    now: () => new Date('2026-10-08T00:00:00Z'),
    quota: {
      limits: { storageBytes: 100, dailyUploads: 10, pendingJobs: 3 },
      now: () => new Date('2026-10-08T00:00:00Z'),
    },
  };
}
