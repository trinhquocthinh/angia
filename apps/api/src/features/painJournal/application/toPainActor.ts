import type { ActorRef } from '@angia/contracts';

export function toPainActor(actor: ActorRef): ActorRef {
  return actor === null ? null : { accountId: actor.accountId, displayName: actor.displayName };
}
