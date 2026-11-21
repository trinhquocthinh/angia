import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createRateLimitKeyHasher } from '@src/shared/rateLimit/infrastructure/createRateLimitKeyHasher.js';
import { createHash, randomUUID } from 'node:crypto';
import { SEND_TRANSACTIONAL_EMAIL_QUEUE } from '@angia/contracts';
import { startProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { createAccountEmails } from '@src/features/account/infrastructure/createAccountEmails.js';

export async function startEmailTestContext() {
  const t = await startProfileTestApp();
  await t.boss.createQueue(SEND_TRANSACTIONAL_EMAIL_QUEUE);
  const emails = createAccountEmails(t.database, t.boss, 'https://angia.example/');
  const now = new Date('2026-11-21T12:00:00Z');
  const rateLimit = {
    store: createRateLimitStore(t.database),
    keyHasher: createRateLimitKeyHasher('email-test-rate-limit-secret'),
    now: () => now.getTime(),
  };
  async function seed(email: string | null = null, verified = false) {
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO accounts(id,display_name,email,email_verified_at) VALUES($1,'Thử',$2,$3)`,
      [id, email, verified ? now : null],
    );
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      id,
      '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA',
    ]);
    const session = await seedSession(t.owner, id);
    return { accountId: id, sessionId: session.id, expectedCredentialVersion: 1 };
  }
  async function rows(accountId: string) {
    return (await t.owner.query('SELECT * FROM accounts WHERE id=$1', [accountId])).rows[0] as {
      email: string | null;
      pending_email: string | null;
      email_verified_at: Date | null;
    };
  }
  async function send(accountId: string) {
    const result = await emails.requestVerification(accountId, now, rateLimit);
    const tokens = await t.owner.query(
      'SELECT * FROM email_verification_tokens WHERE account_id=$1 AND used_at IS NULL',
      [accountId],
    );
    const jobs = await t.owner.query(
      "SELECT * FROM pgboss.job WHERE name=$1 AND data->>'to'=$2 ORDER BY created_on DESC",
      [SEND_TRANSACTIONAL_EMAIL_QUEUE, tokens.rows[0]?.email],
    );
    const job = jobs.rows.find((candidate: { data: { text: string } }) => {
      const token = /#token=([A-Za-z0-9_-]+)/.exec(candidate.data.text)?.[1];
      return token && digest(token) === tokens.rows[0]?.token_hash;
    }) as {
      data: { to: string; subject: string; text: string };
      deletion_seconds: number;
      keep_until: Date;
      start_after: Date;
    };
    const raw = /#token=([A-Za-z0-9_-]+)/.exec(job.data.text)?.[1];
    if (!raw) throw new Error('Không có token trong email');
    return { result, tokens: tokens.rows, jobs: jobs.rows, job, token: raw };
  }
  const digest = (token: string) => createHash('sha256').update(token).digest('hex');
  return { ...t, emails, rateLimit, now, seed, rows, send, digest };
}
