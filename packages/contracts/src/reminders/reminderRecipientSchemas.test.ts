import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { reminderRecipientsSchema, setReminderRecipientsRequestSchema } from './reminderRecipientSchemas.js';

describe('Hợp đồng người nhận nhắc (SPEC-026)', () => {
  it('TC-069: nhận danh sách UUID tài khoản', () => {
    const ids = [randomUUID(), randomUUID()];
    expect(setReminderRecipientsRequestSchema.parse({ recipientAccountIds: ids })).toEqual({
      recipientAccountIds: ids,
    });
  });
  it('TC-070: từ chối danh sách rỗng, ID sai định dạng và trường ngoài hợp đồng', () => {
    for (const body of [
      { recipientAccountIds: [] },
      { recipientAccountIds: ['not-uuid'] },
      { recipientAccountIds: [randomUUID()], extra: true },
      {},
    ]) {
      expect(setReminderRecipientsRequestSchema.safeParse(body).success).toBe(false);
    }
  });
  it('phản hồi gồm chế độ, người nhận và tài khoản main có thể chọn', () => {
    const account = { accountId: randomUUID(), displayName: 'Bố' };
    const body = { mode: 'assigned', recipients: [account], candidates: [account] };
    expect(reminderRecipientsSchema.parse(body)).toEqual(body);
    expect(reminderRecipientsSchema.safeParse({ ...body, mode: 'other' }).success).toBe(false);
  });
});
