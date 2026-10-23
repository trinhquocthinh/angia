import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';
import type { PushSubscriptionShape, SendOutcome } from '../domain/DeliveryTypes.js';
import type { ReminderNotifier } from '../application/ports.js';

export const DRUG_NAME = 'Metformin-Bí-Mật';

const hashOf = (endpoint: string) => createHash('sha256').update(endpoint).digest('hex');

// Seed bằng owner client (bỏ qua RLS): một gia đình, một hồ sơ đã đồng thuận, một main được chỉ định.
export async function seedDeliveryFamily(owner: pg.Client) {
  const [familyId, profileId, mainId] = [randomUUID(), randomUUID(), randomUUID()];
  await owner.query(`INSERT INTO families(id,name) VALUES ($1,'Nhà')`, [familyId]);
  await owner.query(
    `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES ($1,$2,'Main',$3,'main')`,
    [mainId, `sub-${mainId}`, familyId],
  );
  await owner.query(
    `INSERT INTO health_profiles(id,family_id,display_name,consent_status,consent_source,consent_confirmed_at,
       consent_basis,consent_respondent_name) VALUES ($1,$2,'Bé An','confirmed','invitation',now(),'guardian','Mẹ')`,
    [profileId, familyId],
  );
  await owner.query(
    `INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES ($1,$2,$3)`,
    [profileId, familyId, mainId],
  );
  const addDevice = async (accountId = mainId) => {
    const id = randomUUID();
    const endpoint = `https://push.example/${id}`;
    await owner.query(
      `INSERT INTO push_subscriptions(id,family_id,account_id,endpoint,endpoint_hash,p256dh,auth,authorized_at)
       VALUES ($1,$2,$3,$4,$5,'p256dh','auth',now())`,
      [id, familyId, accountId, endpoint, hashOf(endpoint)],
    );
    return { id, endpoint };
  };
  const addReminder = async (scheduledAt: Date, slot = 'morning') => {
    const id = randomUUID();
    await owner.query(
      `INSERT INTO reminders(id,family_id,health_profile_id,date,slot,scheduled_at,medications)
       VALUES ($1,$2,$3,'2026-10-23',$4,$5,$6::jsonb)`,
      [id, familyId, profileId, slot, scheduledAt, JSON.stringify([{ name: DRUG_NAME }])],
    );
    return id;
  };
  return { familyId, profileId, mainId, addDevice, addReminder };
}

export interface DeliveryRow {
  push_subscription_id: string | null;
  status: string;
  attempts: number;
  next_attempt_at: Date | null;
  accepted_at: Date | null;
  last_error: string | null;
}

export async function deliveriesOf(owner: pg.Client, reminderId: string): Promise<DeliveryRow[]> {
  const { rows } = await owner.query<DeliveryRow>(
    `SELECT push_subscription_id, status, attempts, next_attempt_at, accepted_at, last_error
       FROM reminder_deliveries WHERE reminder_id = $1 ORDER BY created_at, id`,
    [reminderId],
  );
  return rows;
}

export async function sentAtOf(owner: pg.Client, reminderId: string): Promise<Date | null> {
  const { rows } = await owner.query<{ sent_at: Date | null }>('SELECT sent_at FROM reminders WHERE id=$1', [
    reminderId,
  ]);
  return rows[0]?.sent_at ?? null;
}

type Call = { subscription: PushSubscriptionShape; reminderId: string; ttlSeconds: number };

// Notifier giả: ghi lại lời gọi, kết quả theo endpoint (mặc định accepted); `onSend` chạy trước khi trả.
export function fakeNotifier(
  outcomeFor: (endpoint: string) => SendOutcome = () => ({ kind: 'accepted' }),
  onSend?: (endpoint: string) => Promise<void>,
) {
  const calls: Call[] = [];
  const notifier: ReminderNotifier = {
    send: async (subscription, reminderId, ttlSeconds) => {
      calls.push({ subscription, reminderId, ttlSeconds });
      await onSend?.(subscription.endpoint);
      return outcomeFor(subscription.endpoint);
    },
  };
  return {
    notifier,
    calls,
    callsTo: (endpoint: string) => calls.filter((c) => c.subscription.endpoint === endpoint),
  };
}

export const plus = (base: Date, minutes: number) => new Date(base.getTime() + minutes * 60_000);
export { hashOf };
