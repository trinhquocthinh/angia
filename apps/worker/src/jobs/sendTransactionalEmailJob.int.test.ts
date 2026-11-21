import { SEND_TRANSACTIONAL_EMAIL_QUEUE } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { createSmtpMailer } from '@src/shared/mailer/createSmtpMailer.js';
import { registerSendTransactionalEmailJob } from './registerSendTransactionalEmailJob.js';

type ReceivedMessage = {
  ID: string;
  To: { Address: string }[];
  From: { Address: string };
  Subject: string;
  Text: string;
  HTML: string;
  Attachments: unknown[];
};
describe('Email giao dịch qua PostgreSQL, pg-boss và Mailpit thật', () => {
  let fixture: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  let container: StartedTestContainer;
  let boss: PgBoss;
  let apiUrl: string;
  const from = 'no-reply@example.test';
  const logger = pino({ level: 'silent' });
  beforeAll(async () => {
    fixture = await createSanitizePgFixture();
    container = await new GenericContainer('axllent/mailpit:v1.34.0')
      .withExposedPorts(1025, 8025)
      .withWaitStrategy(Wait.forHttp('/readyz', 8025))
      .start();
    apiUrl = `http://${container.getHost()}:${container.getMappedPort(8025)}`;
    boss = createPgBoss(fixture.appUrl, logger);
    await boss.start();
    await registerSendTransactionalEmailJob(
      boss,
      createSmtpMailer({
        host: container.getHost(),
        port: container.getMappedPort(1025),
        secure: false,
        from,
      }),
      logger,
    );
  });
  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await container?.stop();
    await fixture?.close();
  });
  async function receive() {
    const response = await fetch(`${apiUrl}/api/v1/messages`);
    if (!response.ok) throw new Error('Không đọc được danh sách email thử');
    return (await response.json()) as { messages: ReceivedMessage[] };
  }
  it('TC-880: job thật gửi đúng To/From/Subject/Text, chỉ link và câu chữ trung tính', async () => {
    const payload = {
      to: 'reader@example.test',
      subject: 'Thông báo tài khoản',
      text: 'Mở liên kết để tiếp tục: https://example.test/account',
    };
    expect(await boss.send(SEND_TRANSACTIONAL_EMAIL_QUEUE, payload)).toBeTypeOf('string');
    await expect
      .poll(async () => (await receive()).messages.length, { timeout: 15000, interval: 100 })
      .toBe(1);
    const id = (await receive()).messages[0]!.ID;
    const response = await fetch(`${apiUrl}/api/v1/message/${id}`);
    expect(response.ok).toBe(true);
    const mail = (await response.json()) as ReceivedMessage;
    expect({ to: mail.To[0]?.Address, subject: mail.Subject, text: mail.Text.trimEnd() }).toEqual(payload);
    expect(mail.From.Address).toBe(from);
    expect(mail.To).toHaveLength(1);
    expect(mail.HTML).toBe('');
    expect(mail.Attachments).toHaveLength(0);
    for (const forbidden of ['synthetic-password-880', 'synthetic-token-880', 'Paracetamol', 'Metformin']) {
      expect(mail.Subject + mail.Text).not.toContain(forbidden);
    }
    expect(
      (await fixture.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
});
