import type { PushSubscriptionValue } from '../domain/isAllowedPushSubscription.js';
export interface PushActor {
  familyId: string;
  accountId: string;
  sessionId: string;
}
type SavePushResult = 'saved' | 'conflict' | 'quota' | 'expired';
export interface PushSubscriptionRepository {
  save(actor: PushActor, value: PushSubscriptionValue, now: Date): Promise<SavePushResult>;
  read(actor: PushActor, now: Date): Promise<PushSubscriptionValue | null>;
  remove(actor: PushActor, endpoint?: string): Promise<void>;
}
export interface PushSender {
  send(value: PushSubscriptionValue): Promise<'accepted' | 'gone' | 'failed'>;
}
export interface PushDependencies {
  repository: PushSubscriptionRepository;
  sender: PushSender;
  publicKey: string | null;
  now(): Date;
}
