import { randomUUID } from 'node:crypto';
import type { PrivacyQueue } from '@src/features/documentPrivacy/infrastructure/createPrivacyQueue.js';
import { createPrivacyRepository } from '@src/features/documentPrivacy/infrastructure/createPrivacyRepository.js';
import { hashPrivacyPng } from '@src/features/documentPrivacy/infrastructure/hashPrivacyPng.js';
import type { PrivacyDependencies } from '@src/features/documentPrivacy/application/ports.js';
import type { ProfileTestApp } from './startProfileTestApp.js';
export function createPrivacyIntegrationDeps(
  t: ProfileTestApp,
  queue: PrivacyQueue,
  onRead: () => Promise<void> = async () => {},
): PrivacyDependencies {
  return {
    repository: createPrivacyRepository(t.database, queue),
    queue,
    hashPng: hashPrivacyPng,
    newId: randomUUID,
    now: () => new Date(),
    reader: {
      get: async (key) => {
        const object = t.objects.get(key);
        await onRead();
        if (!object) return null;
        return {
          contentType: object.contentType,
          body: new ReadableStream({
            start(c) {
              c.enqueue(object.body);
              c.close();
            },
          }),
        };
      },
    },
  };
}
