import type { PushSubscriptionValue } from '@angia/web-push';
export interface PushActor {
  familyId: string;
  accountId: string;
  sessionId: string;
  deviceId?: string | null;
}
export type PushIntent = 'enable' | 'sync';
type SavePushResult = { deviceId: string } | 'conflict' | 'quota' | 'expired' | 'missing';
export interface PushSubscriptionRepository {
  save(
    actor: PushActor,
    value: PushSubscriptionValue,
    now: Date,
    intent?: PushIntent,
  ): Promise<SavePushResult>;
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
