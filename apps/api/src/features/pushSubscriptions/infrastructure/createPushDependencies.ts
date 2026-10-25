import type { Database } from '@src/shared/db/createDatabase.js';
import type { ApiConfig } from '@src/shared/config/loadApiConfig.js';
import type { PushDependencies } from '../application/ports.js';
import { createPushSubscriptionRepository } from './createPushSubscriptionRepository.js';
import { createWebPushSender } from './createWebPushSender.js';
export function createPushDependencies(db: Database, config: ApiConfig): PushDependencies {
  const vapid =
    config.WEB_PUSH_PUBLIC_KEY && config.WEB_PUSH_PRIVATE_KEY && config.WEB_PUSH_SUBJECT
      ? {
          publicKey: config.WEB_PUSH_PUBLIC_KEY,
          privateKey: config.WEB_PUSH_PRIVATE_KEY,
          subject: config.WEB_PUSH_SUBJECT,
        }
      : null;
  return {
    repository: createPushSubscriptionRepository(db),
    sender: createWebPushSender(vapid),
    publicKey: vapid?.publicKey ?? null,
    now: () => new Date(),
  };
}
