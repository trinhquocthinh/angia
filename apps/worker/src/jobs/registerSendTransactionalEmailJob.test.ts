import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { expect, it, vi } from 'vitest';
import { registerSendTransactionalEmailJob } from './registerSendTransactionalEmailJob.js';

it('TC-880: tạo queue retry đúng thiết kế, xử lý batch một email và bỏ batch rỗng', async () => {
  const boss = { createQueue: vi.fn(), work: vi.fn() };
  const mailer = { send: vi.fn(async () => undefined) };
  const logger = { info: vi.fn(), error: vi.fn() };
  await registerSendTransactionalEmailJob(boss as unknown as PgBoss, mailer, logger as unknown as Logger);
  expect(boss.createQueue).toHaveBeenCalledExactlyOnceWith('send-transactional-email', {
    retryLimit: 5,
    retryDelay: 60,
    retryBackoff: true,
  });
  expect(boss.work).toHaveBeenCalledExactlyOnceWith(
    'send-transactional-email',
    { batchSize: 1 },
    expect.any(Function),
  );
  const handle = boss.work.mock.calls[0]?.[2] as (jobs: { id: string; data: unknown }[]) => Promise<void>;
  const data = { to: 'reader@example.test', subject: 'Thông báo', text: 'Mở https://example.test/account' };
  await handle([]);
  expect(mailer.send).not.toHaveBeenCalled();
  await handle([{ id: 'j1', data }]);
  expect(mailer.send).toHaveBeenCalledExactlyOnceWith(data);
});
