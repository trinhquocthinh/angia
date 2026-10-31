import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { sendReminders } from '../application/sendReminders.js';
import { createDeliveryRepository } from './createDeliveryRepository.js';
import { fakeNotifier } from './seedDeliveryFamily.test-helper.js';
import { REVISIT_NOW, seedRevisitFamily } from './revisitReminder.test-helper.js';

const execute = promisify(execFile);
const cwd = fileURLToPath(new URL('../../../../../..', import.meta.url));

describe('Đối soát nhắc tái khám qua CLI thật', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => fx?.close());

  it('TC-480: đọc được hai loại ledger bằng role app và báo cáo riêng/gộp không có tên hồ sơ', async () => {
    const f = await seedRevisitFamily(fx.owner);
    await f.addDevice();
    await f.addRevisit();
    await f.addReminder(REVISIT_NOW);
    await sendReminders(createDeliveryRepository(fx.pool, randomUUID), fakeNotifier().notifier, {
      now: () => REVISIT_NOW,
    });
    let stdout = '';
    try {
      ({ stdout } = await execute(
        'yarn',
        ['ops:reminder-audit', '--since', '2026-11-17T00:00:00Z', '--until', '2026-11-19T00:00:00Z'],
        { cwd, env: { ...process.env, REMINDER_AUDIT_DATABASE_URL: fx.appUrl } },
      ));
    } catch (error) {
      // Chỉ có hai ngày mẫu: CLI phải thoát 1, không được nhầm lỗi truy vấn (mã 2/stack trace).
      expect((error as { code: number }).code).toBe(1);
      stdout = (error as { stdout: string }).stdout;
    }
    expect(stdout).toContain('Mới có 2/7 ngày có lời nhắc');
    expect(stdout).toContain('| medication | 1 | 1 | 100.0% |');
    expect(stdout).toContain('| revisit | 1 | 1 | 100.0% |');
    expect(stdout).toContain('| Tổng | 2 | 2 | 100.0% |');
    expect(stdout).not.toContain('Bé An');
  });
});
