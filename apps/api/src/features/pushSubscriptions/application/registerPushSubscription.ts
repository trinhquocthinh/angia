import { isAllowedPushSubscription, type PushSubscriptionValue } from '@angia/web-push';
import type { PushActor, PushDependencies, PushIntent } from './ports.js';
export async function registerPushSubscription(
  deps: PushDependencies,
  actor: PushActor,
  value: PushSubscriptionValue,
  intent: PushIntent = 'enable',
) {
  if (!deps.publicKey) return 'disabled' as const;
  if (!isAllowedPushSubscription(value)) return 'invalid' as const;
  return deps.repository.save(actor, value, deps.now(), intent);
}
