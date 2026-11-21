import { describe, expect, it } from 'vitest';
import { sendTransactionalEmailJobSchema } from './sendTransactionalEmailJob.js';

const message = { to: 'reader@example.test', subject: 'Thông báo', text: 'Mở https://example.test/account' };
describe('Hợp đồng email giao dịch', () => {
  it('TC-880: nhận đúng nội dung đã render và loại trường ngoài hợp đồng', () => {
    expect(sendTransactionalEmailJobSchema.parse({ ...message, password: 'secret' })).toEqual(message);
  });
  it.each([
    { to: undefined },
    { to: 'sai' },
    { subject: undefined },
    { subject: '' },
    { subject: 'a'.repeat(201) },
    { text: '' },
    { text: 'a'.repeat(10001) },
  ])('TC-880: từ chối payload sai %j', (invalid) => {
    expect(sendTransactionalEmailJobSchema.safeParse({ ...message, ...invalid }).success).toBe(false);
  });
  it('TC-880: chấp nhận biên giới hạn subject và text', () => {
    expect(
      sendTransactionalEmailJobSchema.safeParse({
        ...message,
        subject: 'a'.repeat(200),
        text: 'a'.repeat(10000),
      }).success,
    ).toBe(true);
  });
});
