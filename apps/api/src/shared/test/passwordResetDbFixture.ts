import { createHash, randomUUID } from 'node:crypto';
import { seedLegalAcceptance } from './seedLegalAcceptance.js';
import { seedSession } from './seedAuthFixtures.js';
import { startRegistrationTestApp } from './startRegistrationTestApp.js';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export async function startPasswordResetContext() {
  const tasks: Promise<void>[] = [];
  let fixedNow: Date | undefined;
  const t = await startRegistrationTestApp(false, {
    now: () => fixedNow ?? new Date(),
    runInBackground: (task) => {
      tasks.push(Promise.resolve().then(task));
    },
  });
  const setNow = (now?: Date) => {
    fixedNow = now;
  };
  const drain = async () => {
    await Promise.all(tasks.splice(0));
  };
  const request = (path: string, body: object, ip: string = randomUUID(), origin = 'https://angia.example') =>
    t.app.request(`/api/auth/${path}`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', 'x-test-ip': ip },
      body: JSON.stringify(body),
    });
  const send = (email: string, ip?: string) => request('password-reset-requests', { email }, ip);
  const reset = (token: string, newPassword = 'NewStrongPassword123') =>
    request('password-resets', { token, newPassword });
  const jobs = async (email: string) =>
    (
      await t.owner.query(
        "SELECT * FROM pgboss.job WHERE name='send-transactional-email' AND data->>'to'=$1 ORDER BY created_on DESC",
        [email],
      )
    ).rows;
  const tokens = async (id: string) =>
    (await t.owner.query('SELECT * FROM password_reset_tokens WHERE account_id=$1', [id])).rows;
  async function seed(verified = true, locked = false) {
    const id = randomUUID();
    const email = `${id}@example.com`;
    const password = 'OldStrongPassword123';
    const now = t.account.now();
    await t.owner.query(
      `INSERT INTO accounts(id,username_normalized,display_name,email,email_verified_at,locked_at,lock_reason)
      VALUES($1,$2,'Thử đặt lại',$3,$4,$5,$6)`,
      [id, id.slice(0, 20), email, verified ? now : null, locked ? now : null, locked ? 'Thử khoá' : null],
    );
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      id,
      await t.account.hasher.hash(password),
    ]);
    await seedLegalAcceptance(t.owner, id);
    return { id, email, password, device: await seedSession(t.owner, id) };
  }
  async function link(email: string) {
    const response = await send(email);
    await drain();
    const job = (await jobs(email))[0];
    const token = /\/reset-password#token=([A-Za-z0-9_-]+)/.exec(job.data.text)?.[1];
    if (!token) throw new Error('Không có token đặt lại trong email');
    return { response, job, token };
  }
  return { ...t, request, send, reset, jobs, tokens, seed, link, digest, drain, setNow };
}
