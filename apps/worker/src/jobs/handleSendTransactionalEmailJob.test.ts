import { describe, expect, it, vi } from 'vitest';
import { handleSendTransactionalEmailJob } from './handleSendTransactionalEmailJob.js';

const message = {
  to: 'reader@example.test',
  subject: 'Thông báo riêng',
  text: 'Mở https://example.test/account',
};
function setup() {
  const mailer = { send: vi.fn(async () => undefined) };
  const logger = { info: vi.fn(), error: vi.fn() };
  return { mailer, logger, handle: handleSendTransactionalEmailJob(mailer, logger) };
}
describe('Xử lý email giao dịch', () => {
  it('TC-880: gửi đúng một lần và chỉ log jobId khi thành công', async () => {
    const { mailer, logger, handle } = setup();
    await handle({ id: 'j1', data: { ...message, password: 'không gửi' } });
    expect(mailer.send).toHaveBeenCalledExactlyOnceWith(message);
    expect(logger.info).toHaveBeenCalledExactlyOnceWith({ jobId: 'j1' }, expect.any(String));
    expect(logger.error).not.toHaveBeenCalled();
    for (const value of Object.values(message))
      expect(JSON.stringify(logger.info.mock.calls)).not.toContain(value);
  });
  it.each([{ to: undefined }, { to: 'sai' }, { subject: undefined }])(
    'TC-880: payload sai %j không gửi, không retry và không log nội dung',
    async (invalid) => {
      const { mailer, logger, handle } = setup();
      await expect(handle({ id: 'j2', data: { ...message, ...invalid } })).resolves.toBeUndefined();
      expect(mailer.send).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledExactlyOnceWith({ jobId: 'j2' }, expect.any(String));
      expect(logger.info).not.toHaveBeenCalled();
      const logs = JSON.stringify(logger.error.mock.calls);
      for (const value of [...Object.values(message), 'subject', 'text', '"to"'])
        expect(logs).not.toContain(value);
    },
  );
  it('TC-880: ném lại lỗi SMTP cho pg-boss retry, không log PII trong lỗi', async () => {
    const { mailer, logger, handle } = setup();
    const error = new Error(JSON.stringify(message));
    mailer.send.mockRejectedValueOnce(error);
    await expect(handle({ id: 'j3', data: message })).rejects.toBe(error);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});
