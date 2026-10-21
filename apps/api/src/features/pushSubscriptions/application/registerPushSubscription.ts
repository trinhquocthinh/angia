import {
  isAllowedPushSubscription,
  type PushSubscriptionValue,
} from '../domain/isAllowedPushSubscription.js';
import type { PushActor, PushDependencies } from './ports.js';
export async function registerPushSubscription(
  deps: PushDependencies,
  actor: PushActor,
  value: PushSubscriptionValue,
) {
  if (!deps.publicKey) return 'disabled' as const;
  if (!isAllowedPushSubscription(value)) return 'invalid' as const;
  return deps.repository.save(actor, value, deps.now());
}
