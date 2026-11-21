import { describe, expect, it, vi } from 'vitest';
import { createSmtpMailer } from './createSmtpMailer.js';

const config = { host: 'localhost', port: 1025, secure: false, from: 'no-reply@example.test' };
const message = { to: 'reader@example.test', subject: 'Thông báo', text: 'Mở https://example.test/account' };
describe('Adapter SMTP', () => {
  it('TC-880: gửi nguyên văn text với from/to/subject, không thêm HTML hay trường khác', async () => {
    const sendMail = vi.fn(async () => undefined);
    const transport = vi.fn(() => ({ sendMail }));
    await createSmtpMailer(config, transport).send(message);
    expect(sendMail).toHaveBeenCalledExactlyOnceWith({ from: config.from, ...message });
    expect(transport).toHaveBeenCalledExactlyOnceWith({ host: 'localhost', port: 1025, secure: false });
  });
  it('cấu hình auth chỉ khi có đủ user và password', () => {
    const transport = vi.fn(() => ({ sendMail: vi.fn(async () => undefined) }));
    createSmtpMailer({ ...config, user: 'user', password: 'pass', secure: true }, transport);
    expect(transport).toHaveBeenLastCalledWith({
      host: 'localhost',
      port: 1025,
      secure: true,
      auth: { user: 'user', pass: 'pass' },
    });
    for (const credentials of [{}, { user: 'user' }, { password: 'pass' }]) {
      createSmtpMailer({ ...config, ...credentials }, transport);
      expect(transport).toHaveBeenLastCalledWith({ host: 'localhost', port: 1025, secure: false });
    }
  });
  it('TC-880: lỗi transport được trả lại cho bên gọi', async () => {
    const error = new Error('SMTP lỗi');
    const mailer = createSmtpMailer(config, () => ({ sendMail: vi.fn().mockRejectedValue(error) }));
    await expect(mailer.send(message)).rejects.toBe(error);
  });
});
