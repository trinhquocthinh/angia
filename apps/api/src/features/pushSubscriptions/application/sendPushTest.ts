import { isAllowedPushSubscription } from '@angia/web-push';
import type { PushActor, PushDependencies } from './ports.js';
export async function sendPushTest(deps: PushDependencies, actor: PushActor) {
  if (!deps.publicKey) return 'disabled' as const;
  const value = await deps.repository.read(actor, deps.now());
  if (!value) return 'missing' as const;
  if (!isAllowedPushSubscription(value)) return 'failed' as const;
  const result = await deps.sender.send(value);
  if (result === 'gone') await deps.repository.remove(actor, value.endpoint);
  return result;
}
